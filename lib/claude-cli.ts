import { spawn } from 'child_process'
import db from './db'

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude'

export interface ClaudeResult {
  text: string
  tokensIn: number
  tokensOut: number
}

// Run claude -p in headless mode, collect full output
export async function runClaude(prompt: string, skill: string): Promise<ClaudeResult> {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt, '--output-format', 'json']
    const proc = spawn(CLAUDE_BIN, args, { env: process.env })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${stderr}`))

      let text = stdout
      let tokensIn = 0
      let tokensOut = 0

      try {
        const parsed = JSON.parse(stdout)
        text = parsed.result ?? parsed.content ?? stdout
        tokensIn = parsed.usage?.input_tokens ?? 0
        tokensOut = parsed.usage?.output_tokens ?? 0
      } catch {
        // claude output wasn't JSON — treat as plain text
        text = stdout
      }

      // Log token usage to SQLite
      const today = new Date().toISOString().split('T')[0]
      db.prepare(`
        INSERT INTO token_log (date, skill, tokens_in, tokens_out)
        VALUES (?, ?, ?, ?)
      `).run(today, skill, tokensIn, tokensOut)

      resolve({ text, tokensIn, tokensOut })
    })

    proc.on('error', reject)
  })
}

// Stream claude output line by line — for SSE endpoints
export function streamClaude(
  prompt: string,
  skill: string,
  onChunk: (chunk: string) => void,
  onDone: (tokensIn: number, tokensOut: number, model: string) => void,
  onError: (err: Error) => void
) {
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose']
  const proc = spawn(CLAUDE_BIN, args, { env: process.env })

  let tokensIn = 0
  let tokensOut = 0
  let model = ''
  let buffer = ''

  proc.stdout.on('data', (d: Buffer) => {
    buffer += d.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const event = JSON.parse(line)
        if (event.model && !model) model = event.model
        if (event.type === 'assistant' && event.message?.content) {
          for (const block of event.message.content) {
            if (block.type === 'text') onChunk(block.text)
          }
        }
        if (event.usage) {
          tokensIn = event.usage.input_tokens ?? tokensIn
          tokensOut = event.usage.output_tokens ?? tokensOut
        }
      } catch { /* non-JSON line, skip */ }
    }
  })

  proc.on('close', () => {
    const today = new Date().toISOString().split('T')[0]
    db.prepare(`
      INSERT INTO token_log (date, skill, tokens_in, tokens_out)
      VALUES (?, ?, ?, ?)
    `).run(today, skill, tokensIn, tokensOut)
    onDone(tokensIn, tokensOut, model)
  })

  proc.on('error', onError)
  return proc
}
