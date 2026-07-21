'use client'
import { useEffect, useState } from 'react'
import EyebrowLabel from './EyebrowLabel'

interface TokenData {
  daily: { total: number; in: number; out: number; limit: number; pct: number }
  monthly: { total: number; in: number; out: number; limit: number; pct: number }
  bySkill: { skill: string; tokens_in: number; tokens_out: number }[]
}

function fmt(n: number) {
  return n.toLocaleString()
}

function barColor(pct: number) {
  if (pct >= 90) return 'var(--destructive)'
  if (pct >= 75) return 'var(--accent-yellow)'
  return 'var(--accent-primary)'
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
        <EyebrowLabel>Token usage</EyebrowLabel>
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
            <div key={label} className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[14px] font-medium" style={{ color: 'var(--fg-body)' }}>{label}</span>
                <span className="font-mono text-[13px]" style={{ color: barColor(d.pct) }}>
                  {fmt(d.total)} / {fmt(d.limit)}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(d.pct, 100)}%`,
                    background: barColor(d.pct),
                    boxShadow: d.pct > 5 ? `0 0 8px ${barColor(d.pct)}60` : 'none',
                  }}
                />
              </div>
              {d.pct >= 80 && (
                <p className="text-[13px]" style={{ color: 'var(--accent-yellow)' }}>
                  ⚠ {d.pct}% of {label === 'Today' ? 'daily' : 'monthly'} limit
                </p>
              )}
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
            <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
              No usage yet today — run a skill to see tokens.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
