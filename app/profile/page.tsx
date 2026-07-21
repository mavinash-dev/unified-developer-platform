'use client'
import { useEffect, useState } from 'react'
import EyebrowLabel from '@/components/EyebrowLabel'

interface UserConfig {
  name: string | null
  contextFiles: string[]
  createdAt?: string
}

interface Stats {
  totalSessions: number
  totalTokensIn: number
  totalTokensOut: number
  totalApplications: number
  topSkill: string | null
}

export default function ProfilePage() {
  const [config, setConfig] = useState<UserConfig>({ name: null, contextFiles: [] })
  const [stats, setStats] = useState<Stats | null>(null)
  const [name, setName] = useState('')
  const [contextPaths, setContextPaths] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then((u: UserConfig) => {
      setConfig(u)
      setName(u.name ?? '')
      setContextPaths((u.contextFiles ?? []).join('\n'))
    })
    fetch('/api/profile/stats').then(r => r.json()).then(setStats)
  }, [])

  const save = async () => {
    setSaving(true)
    const contextFiles = contextPaths.split('\n').map(l => l.trim()).filter(Boolean)
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), contextFiles }),
    })
    setConfig(c => ({ ...c, name: name.trim(), contextFiles }))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const memberSince = config.createdAt
    ? new Date(config.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      <header className="mx-auto max-w-3xl px-6 py-14 flex flex-col gap-3">
        <EyebrowLabel>Profile</EyebrowLabel>
        <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
          {config.name ? <><span style={{ color: 'var(--accent-primary)' }}>{config.name}</span>.</> : 'Your profile.'}
        </h1>
        {memberSince && (
          <p className="text-[15px]" style={{ color: 'var(--fg-muted)' }}>Member since {memberSince}</p>
        )}
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      <main className="mx-auto max-w-3xl px-6 py-12 flex flex-col gap-10">

        {/* Stats */}
        {stats && (
          <section className="flex flex-col gap-4">
            <EyebrowLabel>Activity</EyebrowLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Skill runs', value: stats.totalSessions },
                { label: 'Tokens used', value: fmtNum(stats.totalTokensIn + stats.totalTokensOut) },
                { label: 'Applications', value: stats.totalApplications },
                { label: 'Top skill', value: stats.topSkill ? `/${stats.topSkill}` : '—', mono: true },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-[12px] p-4 flex flex-col gap-1"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <span className={`text-[20px] font-semibold ${s.mono ? 'font-mono text-[15px]' : ''}`} style={{ color: 'var(--accent-primary)' }}>
                    {s.value}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <hr className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />

        {/* Name */}
        <section className="flex flex-col gap-4">
          <div>
            <EyebrowLabel>Display name</EyebrowLabel>
            <p className="text-[13px] mt-1" style={{ color: 'var(--fg-muted)' }}>
              Used in greetings and injected into every skill run so Claude knows who it&apos;s helping.
            </p>
          </div>
          <input
            className="dev-input text-[15px] max-w-xs"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
        </section>

        {/* Context files */}
        <section className="flex flex-col gap-4">
          <div>
            <EyebrowLabel>Context files</EyebrowLabel>
            <p className="text-[13px] mt-1" style={{ color: 'var(--fg-muted)' }}>
              One file path per line. Contents are prepended to every skill and chat prompt automatically.
              Great for facts.md, current company context, your resume, or any reference doc.
            </p>
          </div>
          <textarea
            className="dev-input resize-none text-[14px] font-mono"
            rows={5}
            value={contextPaths}
            onChange={e => setContextPaths(e.target.value)}
            placeholder={'~/facts.md\n~/company-context.md\n~/Downloads/resume.pdf'}
          />
          <div className="flex flex-col gap-1">
            {contextPaths.split('\n').map(l => l.trim()).filter(Boolean).map(p => (
              <div key={p} className="flex items-center gap-2">
                <span className="font-mono text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                  {p}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Save */}
        <div>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="btn btn-md btn-primary"
            style={{ minWidth: 140 }}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        <hr className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />

        {/* Storage info */}
        <section className="flex flex-col gap-2">
          <EyebrowLabel>Storage</EyebrowLabel>
          <div className="rounded-[12px] p-4 flex flex-col gap-2" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
            <Row label="Config file" value="~/.udd/user.json" />
            <Row label="Database" value="data/career.db (SQLite)" />
            <Row label="Skills" value="skills/*.md → ~/.claude/commands/" />
          </div>
          <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            Everything is local — no cloud storage, no accounts.
          </p>
        </section>
      </main>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-[11px] uppercase tracking-widest shrink-0" style={{ color: 'var(--fg-muted)' }}>{label}</span>
      <code className="font-mono text-[12px] text-right" style={{ color: 'var(--fg-body)' }}>{value}</code>
    </div>
  )
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}
