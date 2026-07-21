'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  skillId: string
  description?: string
  defaultArgs?: string
}

interface SkillAction {
  next: string
  label: string
}

function parseAndStripActions(text: string): { clean: string; actions: SkillAction[] } {
  const actions: SkillAction[] = []
  const clean = text.replace(/SKILL_ACTION:\s*(\{[^\n]+\})/g, (_, json) => {
    try { actions.push(JSON.parse(json)) } catch { /* skip malformed */ }
    return ''
  }).replace(/\n{3,}/g, '\n\n')
  return { clean, actions }
}

export default function SkillRunner({ skillId, description, defaultArgs = '' }: Props) {
  const [args, setArgs] = useState(defaultArgs)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [tokens, setTokens] = useState<{ in: number; out: number } | null>(null)
  const [skillActions, setSkillActions] = useState<SkillAction[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const termRef  = useRef<HTMLDivElement>(null)
  const router   = useRouter()

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [output])

  const run = useCallback(async () => {
    if (status === 'running') { abortRef.current?.abort(); setStatus('idle'); return }
    setOutput(''); setTokens(null); setSkillActions([]); setStatus('running')
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/skills/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: skillId, args }),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setOutput(`❌ ${err.error ?? 'Unknown error'}`); setStatus('error'); return
      }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) { setStatus('error'); return }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.text) {
              const { clean, actions } = parseAndStripActions(ev.text)
              if (clean) setOutput(p => p + clean)
              if (actions.length) setSkillActions(p => {
                const existing = new Set(p.map(a => a.next))
                return [...p, ...actions.filter(a => !existing.has(a.next))]
              })
            }
            if (ev.done)  setTokens({ in: ev.tokensIn, out: ev.tokensOut })
            if (ev.error) { setOutput(p => p + `\n\n❌ ${ev.error}`); setStatus('error') }
          } catch { /* skip */ }
        }
      }
      setStatus(p => p === 'error' ? 'error' : 'done')
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') setStatus('idle')
      else { setOutput(p => p + `\n\n❌ ${e instanceof Error ? e.message : 'Error'}`); setStatus('error') }
    }
  }, [skillId, args, status])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run])

  const isRunning = status === 'running'
  const statusColor = { idle: 'var(--fg-muted)', running: 'var(--accent-primary)', done: '#3fb950', error: 'var(--destructive)' }

  return (
    <div className="flex flex-col rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}>

      {/* Terminal chrome bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--canvas)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#f85149', opacity: 0.8 }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#f7d354', opacity: 0.8 }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#3fb950', opacity: 0.8 }} />
          </div>
          <span className="font-mono text-[13px]" style={{ color: 'var(--fg-muted)' }}>/{skillId}</span>
        </div>
        <div className="flex items-center gap-3">
          {tokens && (
            <span className="font-mono text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              ↑{tokens.in.toLocaleString()} ↓{tokens.out.toLocaleString()} tokens
            </span>
          )}
          <span
            className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
            style={{
              background: statusColor[status],
              boxShadow: isRunning ? `0 0 8px var(--accent-primary)` : 'none',
            }}
          />
        </div>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: 'var(--elevated)', borderColor: 'var(--border-subtle)' }}>
        <span className="font-mono text-[14px] shrink-0" style={{ color: 'var(--accent-primary)', opacity: 0.7 }}>$</span>
        <input
          className="dev-input"
          value={args}
          onChange={e => setArgs(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.metaKey && !e.ctrlKey && run()}
          placeholder={`args for /${skillId}  ·  press ↵ or ⌘↵ to run`}
          disabled={isRunning}
          aria-label={`Arguments for ${skillId}`}
        />
        <button
          onClick={run}
          className={`btn btn-sm ${isRunning ? 'btn-danger' : 'btn-primary'}`}
          style={{ fontFamily: 'var(--font-geist-mono)', minWidth: 72 }}
          aria-label={isRunning ? 'Stop' : 'Run skill'}
        >
          {isRunning ? '■ Stop' : '▶ Run'}
        </button>
      </div>

      {/* Output */}
      <div
        ref={termRef}
        className="terminal min-h-[280px] max-h-[520px] overflow-y-auto p-5"
        aria-live="polite"
      >
        {!output && status === 'idle' && (
          <div className="flex flex-col gap-2">
            <span style={{ color: 'var(--fg-muted)' }}>
              <span style={{ color: 'var(--accent-primary)', opacity: 0.6 }}>~/</span>
              {' '}/{skillId}{args && <span style={{ color: 'var(--accent-blue)' }}> &quot;{args}&quot;</span>}
            </span>
            {description && (
              <span className="text-[12px] mt-1" style={{ color: 'var(--fg-muted)', opacity: 0.55 }}>{description}</span>
            )}
            <span className="text-[12px]" style={{ color: 'var(--fg-muted)', opacity: 0.4 }}>▶ Run or ⌘↵ to start</span>
          </div>
        )}
        {!output && isRunning && (
          <span style={{ color: 'var(--accent-primary)' }}>Running /{skillId}…</span>
        )}
        {output && <pre className="whitespace-pre-wrap" style={{ color: 'var(--fg-body)' }}>{output}</pre>}
        {isRunning && (
          <span className="inline-block w-2 h-4 ml-0.5 align-middle animate-pulse" style={{ background: 'var(--accent-primary)', opacity: 0.8 }} />
        )}
        {(status === 'done' || status === 'error') && (
          <div className="mt-4 pt-4 border-t flex flex-col gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
            {status === 'done' && (
              <span className="font-mono text-[12px]" style={{ color: '#3fb950' }}>✓ done</span>
            )}
            {status === 'error' && (
              <span className="font-mono text-[12px]" style={{ color: 'var(--destructive)' }}>✗ exited with error</span>
            )}
            {skillActions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {skillActions.map(action => (
                  <button
                    key={action.next}
                    onClick={() => router.push(`/?skill=${action.next}`)}
                    className="btn btn-sm btn-secondary"
                    style={{ fontFamily: 'var(--font-geist-mono)' }}
                  >
                    → {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
