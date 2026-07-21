import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { streamClaude } from '@/lib/claude-cli'

const SKILL_PATH = path.join(os.homedir(), '.claude', 'commands', 'resume-update.md')

export async function POST(req: NextRequest) {
  const { args = '' } = await req.json()

  let skillPrompt = ''
  try {
    skillPrompt = fs.readFileSync(SKILL_PATH, 'utf-8')
    skillPrompt = skillPrompt.replace(/\$ARGUMENTS/g, args)
  } catch {
    return new Response(JSON.stringify({ error: 'resume-update skill not found at ' + SKILL_PATH }), { status: 500 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      streamClaude(
        skillPrompt,
        'resume-update',
        (chunk) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
        },
        (tokensIn, tokensOut) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, tokensIn, tokensOut })}\n\n`))
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
