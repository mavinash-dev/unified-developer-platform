'use client'
import { useState } from 'react'

interface Props {
  onComplete: (name: string) => void
}

export default function Onboarding({ onComplete }: Props) {
  const [name, setName] = useState('')
  const [contextPaths, setContextPaths] = useState('')
  const [step, setStep] = useState<'name' | 'context'>('name')
  const [saving, setSaving] = useState(false)

  const submitName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setStep('context')
  }

  const finish = async (skip = false) => {
    setSaving(true)
    const contextFiles = skip
      ? []
      : contextPaths.split('\n').map(l => l.trim()).filter(Boolean)

    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), contextFiles }),
    })
    onComplete(name.trim())
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'var(--canvas)' }}>
      <div className="w-full max-w-lg px-6">

        {step === 'name' && (
          <form onSubmit={submitName} className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-[11px] font-medium tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>
                ⚡ UDD — First run
              </p>
              <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
                What&apos;s your name?
              </h1>
              <p className="text-[16px]" style={{ color: 'var(--fg-body)' }}>
                Your dashboard, your name.
              </p>
            </div>

            <div className="flex gap-3">
              <input
                className="dev-input flex-1 text-[16px]"
                placeholder="e.g. Priya"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="btn btn-md btn-primary"
                style={{ minWidth: 100 }}
              >
                Next →
              </button>
            </div>
          </form>
        )}

        {step === 'context' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-[11px] font-medium tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>
                ⚡ UDD — Context (optional)
              </p>
              <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
                Share your context.
              </h1>
              <p className="text-[16px]" style={{ color: 'var(--fg-body)' }}>
                Point to files on your disk that describe you and your work.
                Skills will read these automatically — no need to re-explain yourself every run.
              </p>
            </div>

            <div className="util-card flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[14px] font-medium" style={{ color: 'var(--fg-body)' }}>Context file paths</p>
                <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                  One path per line. Examples:
                </p>
                <div className="font-mono text-[12px] mt-1 flex flex-col gap-0.5" style={{ color: 'var(--fg-muted)' }}>
                  <span>~/facts.md — your career facts, preferences, tech stack</span>
                  <span>~/company-context.md — current company, team, projects</span>
                  <span>~/Downloads/dashboard.html — company portal, internal wiki export</span>
                </div>
              </div>
              <textarea
                className="dev-input resize-none"
                rows={4}
                placeholder={"~/facts.md\n~/company-context.md"}
                value={contextPaths}
                onChange={e => setContextPaths(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => finish(true)}
                className="btn btn-md btn-ghost flex-1"
              >
                Skip for now
              </button>
              <button
                onClick={() => finish(false)}
                disabled={saving}
                className="btn btn-md btn-primary flex-1"
              >
                {saving ? 'Saving…' : `Let's go, ${name} →`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
