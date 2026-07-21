import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { streamClaude } from '@/lib/claude-cli'
import db from '@/lib/db'
import { writeUDDContext, ensureContextFileRegistered } from '@/lib/generate-context'
import { USER_FILE as CONFIG_FILE } from '@/lib/paths'

interface ResumeTemplate { name: string; guidelines: string }

function loadTemplateGuidelines(args: string): string {
  const match = args.match(/\btemplate:([^\s]+)/)
  if (!match) return ''
  const slug = match[1].toLowerCase()
  const row = db.prepare(
    `SELECT name, guidelines FROM resume_templates WHERE lower(replace(name,' ','-')) LIKE ? OR lower(name) LIKE ? LIMIT 1`
  ).get(`%${slug}%`, `%${slug.replace(/-/g, ' ')}%`) as ResumeTemplate | undefined
  if (!row) return ''
  return `[RESUME TEMPLATE: ${row.name}]\n${row.guidelines}\n[/RESUME TEMPLATE]\n\n`
}

// Refresh the UDD context snapshot before every skill run
function refreshContext() {
  try { ensureContextFileRegistered(); writeUDDContext() } catch { /* non-fatal */ }
}

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'commands')

function buildContextPrefix(): string {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    const sections: string[] = []

    if (config.name) {
      sections.push(`The user's name is: ${config.name}`)
    }

    for (const filePath of (config.contextFiles ?? [])) {
      const expanded = filePath.replace(/^~/, os.homedir())
      if (!fs.existsSync(expanded)) continue
      const content = fs.readFileSync(expanded, 'utf-8').trim()
      if (!content) continue
      const label = path.basename(expanded)
      sections.push(`[CONTEXT: ${label}]\n${content}\n[/CONTEXT]`)
    }

    if (sections.length === 0) return ''
    return sections.join('\n\n') + '\n\n---\n\n'
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  refreshContext()

  const { skill, args = '' } = await req.json()

  if (!skill) {
    return new Response(JSON.stringify({ error: 'skill name is required' }), { status: 400 })
  }

  const skillPath = path.join(SKILLS_DIR, `${skill}.md`)

  if (!fs.existsSync(skillPath)) {
    return new Response(JSON.stringify({ error: `Skill "${skill}" not found at ${skillPath}` }), { status: 404 })
  }

  const rawSkill = fs.readFileSync(skillPath, 'utf-8')

  // Extract category from frontmatter for session tagging
  const catMatch = rawSkill.match(/^---\n[\s\S]*?^category:\s*(.+)$/m)
  const category = catMatch ? catMatch[1].trim() : ''

  let prompt = rawSkill.replace(/\$ARGUMENTS/g, args)
  const templateBlock = loadTemplateGuidelines(args)
  const context = buildContextPrefix()
  if (context) prompt = context + prompt
  if (templateBlock) prompt = templateBlock + prompt

  const encoder = new TextEncoder()
  let fullOutput = ''

  const stream = new ReadableStream({
    start(controller) {
      streamClaude(
        prompt,
        skill,
        (chunk) => {
          fullOutput += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
        },
        (tokensIn, tokensOut, model) => {
          // Save session to SQLite
          try {
            db.prepare(`
              INSERT INTO sessions (skill, category, model, tokens_in, tokens_out, args, output)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(skill, category, model, tokensIn, tokensOut, args, fullOutput)
          } catch { /* non-fatal */ }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, tokensIn, tokensOut, model })}\n\n`))
          controller.close()
        },
        (err) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`))
          controller.close()
        }
      )
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
