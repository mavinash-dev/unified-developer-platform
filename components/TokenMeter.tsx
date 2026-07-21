'use client'
import { useEffect, useState } from 'react'
import EyebrowLabel from './EyebrowLabel'

interface TokenData {
  daily: { total: number; in: number; out: number }
  monthly: { total: number; in: number; out: number }
  bySkill: { skill: string; tokens_in: number; tokens_out: number }[]
}

function fmt(n: number) {
  return n.toLocaleString()
}

export default function TokenMeter() {
  const [data, setData] = useState<TokenData | null>(null)

  useEffect(() => {
    fetch('/api/tokens').then(r => r.json()).then(setData)
    const id = setInterval(() => fetch('/api/tokens').then(r => r.json()).then(setData), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="util-card dot-grid-corner h-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <EyebrowLabel>Token usage — UDD runs only</EyebrowLabel>
        <hr className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />
      </div>

      {!data ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-8 rounded-lg" style={{ background: 'var(--elevated)' }} />
          <div className="h-8 rounded-lg" style={{ background: 'var(--elevated)' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {[
            { label: 'Today', d: data.daily },
            { label: 'This month', d: data.monthly },
          ].map(({ label, d }) => (
            <div key={label} className="flex justify-between items-baseline">
              <span className="text-[14px] font-medium" style={{ color: 'var(--fg-body)' }}>{label}</span>
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-mono text-[13px]" style={{ color: 'var(--accent-primary)' }}>
                  {fmt(d.total)} tokens
                </span>
                <span className="font-mono text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                  {fmt(d.in)} in · {fmt(d.out)} out
                </span>
              </div>
            </div>
          ))}

          {data.bySkill.length > 0 && (
            <div className="flex flex-col gap-3">
              <EyebrowLabel>By skill today</EyebrowLabel>
              {data.bySkill.map(s => (
                <div key={s.skill} className="flex justify-between items-center">
                  <span className="text-[14px] font-medium" style={{ color: 'var(--fg-body)' }}>/{s.skill}</span>
                  <span className="font-mono text-[13px]" style={{ color: 'var(--accent-primary)' }}>
                    {fmt(s.tokens_in + s.tokens_out)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {data.bySkill.length === 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
                No skill runs today yet.
              </p>
              <p className="text-[12px]" style={{ color: 'var(--fg-muted)', opacity: 0.6 }}>
                This meter tracks tokens used through UDD only — not your Claude Code terminal usage (Claude CLI has no local usage file to read).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
