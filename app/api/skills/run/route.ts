import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { streamClaude } from '@/lib/claude-cli'

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'commands')

export async function POST(req: NextRequest) {
  const { skill, args = '' } = await req.json()

  if (!skill) {
    return new Response(JSON.stringify({ error: 'skill name is required' }), { status: 400 })
  }

  const skillPath = path.join(SKILLS_DIR, `${skill}.md`)

  if (!fs.existsSync(skillPath)) {
    return new Response(JSON.stringify({ error: `Skill "${skill}" not found at ${skillPath}` }), { status: 404 })
  }

  let prompt = fs.readFileSync(skillPath, 'utf-8')
  prompt = prompt.replace(/\$ARGUMENTS/g, args)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      streamClaude(
        prompt,
        skill,
        (chunk) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
        },
        (tokensIn, tokensOut, model) => {
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
