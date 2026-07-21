'use client'
import { useEffect, useState } from 'react'
import EyebrowLabel from '@/components/EyebrowLabel'
import Spinner from '@/components/Spinner'

interface Session {
  id: number
  skill: string
  category: string
  model: string
  tokens_in: number
  tokens_out: number
  args: string
  created_at: string
}

interface SessionDetail extends Session {
  output: string
}

function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selected, setSelected] = useState<SessionDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/sessions').then(r => r.json()).then(setSessions).catch(() => {})
  }, [])

  const openSession = async (id: number) => {
    setLoadingDetail(true)
    const data = await fetch(`/api/sessions/${id}`).then(r => r.json())
    setSelected(data)
    setLoadingDetail(false)
  }

  const filtered = sessions.filter(s =>
    !filter || s.skill.includes(filter) || s.category.includes(filter) || s.args.includes(filter)
  )

  // Group by date
  const grouped = filtered.reduce((acc, s) => {
    const date = new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(s)
    return acc
  }, {} as Record<string, Session[]>)

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      <header className="mx-auto max-w-5xl flex flex-col gap-4 px-6 py-16 md:py-20">
        <EyebrowLabel>Session History</EyebrowLabel>
        <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
          Every run,{' '}
          <span style={{ color: 'var(--accent-primary)' }}>saved.</span>
        </h1>
        <p className="max-w-2xl text-lg" style={{ color: 'var(--fg-body)' }}>
          Browse past skill sessions. Click any session to view the full output or use it as context for your next run.
        </p>
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-6">
        <input
          className="dev-input max-w-sm"
          placeholder="Filter by skill, category, or args…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />

        {sessions.length === 0 && (
          <div className="util-card">
            <p className="text-[16px] font-medium" style={{ color: 'var(--fg-body)' }}>No sessions yet.</p>
            <p className="text-[14px] mt-2" style={{ color: 'var(--fg-muted)' }}>Run any skill to see it here.</p>
          </div>
        )}

        {Object.entries(grouped).map(([date, daySessions]) => (
          <div key={date} className="flex flex-col gap-3">
            <p className="font-mono text-[11px] font-medium tracking-widest uppercase" style={{ color: 'var(--fg-muted)' }}>
              {date}
            </p>
            {daySessions.map(s => (
              <button
                key={s.id}
                onClick={() => openSession(s.id)}
                className="util-card text-left w-full flex items-center justify-between gap-4 hover:border-[var(--accent-primary)]"
                style={{ borderColor: selected?.id === s.id ? 'var(--accent-primary)' : undefined }}
              >
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-medium" style={{ color: 'var(--accent-primary)' }}>
                      /{s.skill}
                    </span>
                    {s.category && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'var(--fg-muted)', background: 'var(--elevated)' }}>
                        {s.category}
                      </span>
                    )}
                    {s.model && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'var(--accent-blue)', background: 'rgba(61,157,255,0.1)' }}>
                        {s.model}
                      </span>
                    )}
                  </div>
                  {s.args && (
                    <p className="font-mono text-[12px] truncate" style={{ color: 'var(--fg-muted)' }}>
                      $ {s.args}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                    {(s.tokens_in + s.tokens_out).toLocaleString()} tok
                  </span>
                  <span className="font-mono text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                    {timeAgo(s.created_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Session detail drawer */}
      {(selected || loadingDetail) && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-end"
          onClick={e => e.target === e.currentTarget && setSelected(null)}
        >
          <div
            className="h-full flex flex-col border-l overflow-hidden"
            style={{
              width: '50vw',
              background: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[14px] font-semibold" style={{ color: 'var(--accent-primary)' }}>
                  {selected ? `/${selected.skill}` : '…'}
                </span>
                {selected?.model && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full" style={{ color: 'var(--accent-blue)', background: 'rgba(61,157,255,0.1)' }}>
                    {selected.model}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="font-mono text-[13px] hover:opacity-70"
                style={{ color: 'var(--fg-muted)' }}
              >
                ✕ close
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner size="md" />
              </div>
            ) : selected && (
              <div className="flex-1 overflow-y-auto">
                {selected.args && (
                  <div className="px-6 py-3 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--elevated)' }}>
                    <span className="font-mono text-[12px]" style={{ color: 'var(--fg-muted)' }}>$ {selected.args}</span>
                  </div>
                )}
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed" style={{ color: 'var(--fg-body)' }}>
                    {selected.output}
                  </pre>
                </div>
              </div>
            )}

            {selected && (
              <div className="px-6 py-4 border-t flex gap-3 shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-mono text-[12px] self-center" style={{ color: 'var(--fg-muted)' }}>
                  {new Date(selected.created_at).toLocaleString()} · {(selected.tokens_in + selected.tokens_out).toLocaleString()} tokens
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
