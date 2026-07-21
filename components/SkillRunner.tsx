'use client'
import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  skill: 'resume' | 'scout'
  defaultArgs?: string
}

export default function SkillRunner({ skill, defaultArgs = '' }: Props) {
  const [args, setArgs] = useState(defaultArgs)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const title = skill === 'resume' ? 'Resume Update' : 'Job Scout'
  const placeholder = skill === 'resume'
    ? 'e.g. Stripe  or  Google https://jobs.google.com/...'
    : 'e.g. Stripe Senior Engineer  or  Google L5 Python remote'

  async function run() {
    if (running) {
      abortRef.current?.abort()
      setRunning(false)
      return
    }

    setOutput('')
    setTokens(null)
    setRunning(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch(`/api/skills/${skill}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args }),
        signal: ctrl.signal,
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.text) setOutput(prev => prev + event.text)
            if (event.done) setTokens({ in: event.tokensIn, out: event.tokensOut })
            if (event.error) setOutput(prev => prev + `\n\n❌ Error: ${event.error}`)
          } catch { /* skip malformed */ }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setOutput(prev => prev + `\n\n❌ ${e.message}`)
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {tokens && (
            <Badge variant="outline" className="text-xs">
              ↑{tokens.in.toLocaleString()} ↓{tokens.out.toLocaleString()} tokens
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1">
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={args}
            onChange={e => setArgs(e.target.value)}
            placeholder={placeholder}
            onKeyDown={e => e.key === 'Enter' && run()}
            disabled={running}
          />
          <button
            onClick={run}
            className={`px-4 py-1.5 rounded text-sm font-medium text-white transition-colors ${
              running ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {running ? 'Stop' : 'Run'}
          </button>
        </div>

        <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto rounded border bg-muted/30 p-3">
          {output ? (
            <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">{output}</pre>
          ) : (
            <p className="text-xs text-muted-foreground">
              {running ? '⏳ Running...' : `Enter arguments and click Run to start /${skill === 'resume' ? 'resume-update' : 'job-scout'}`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
