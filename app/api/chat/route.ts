import { NextRequest } from 'next/server'
import { streamClaude } from '@/lib/claude-cli'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { USER_FILE as CONFIG_FILE } from '@/lib/paths'

interface Message { role: 'user' | 'assistant'; content: string }

function buildContextPrefix(): string {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    const sections: string[] = []
    if (config.name) sections.push(`The user's name is: ${config.name}`)
    for (const filePath of (config.contextFiles ?? [])) {
      const expanded = filePath.replace(/^~/, os.homedir())
      if (!fs.existsSync(expanded)) continue
      const content = fs.readFileSync(expanded, 'utf-8').trim()
      if (content) sections.push(`[CONTEXT: ${path.basename(expanded)}]\n${content}\n[/CONTEXT]`)
    }
    return sections.length ? sections.join('\n\n') + '\n\n---\n\n' : ''
  } catch { return '' }
}

export async function POST(req: NextRequest) {
  const { message, history = [] }: { message: string; history: Message[] } = await req.json()
  if (!message?.trim()) return new Response('{"error":"message required"}', { status: 400 })

  const context = buildContextPrefix()

  const conversation = [
    ...history.map((m: Message) => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`),
    `Human: ${message}`,
  ].join('\n\n')

  const prompt = `${context}You are a helpful AI assistant in a developer workspace. Be concise and practical.\n\n${conversation}\n\nAssistant:`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      streamClaude(
        prompt, '__chat__',
        (chunk) => controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)),
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
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
  })
}
