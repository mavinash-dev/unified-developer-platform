import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { streamClaude } from '@/lib/claude-cli'
import db from '@/lib/db'

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'commands')
const CONFIG_FILE = path.join(os.homedir(), '.udd', 'user.json')

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
  const context = buildContextPrefix()
  if (context) prompt = context + prompt

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
