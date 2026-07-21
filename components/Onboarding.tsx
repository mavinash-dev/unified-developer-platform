'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props { onComplete: (name: string) => void }

const SUGGESTIONS = [
  { label: 'My Resume',       hint: 'Work history, skills, achievements' },
  { label: 'About Me',        hint: 'Who you are, what you\'re looking for' },
  { label: 'Tech Stack',      hint: 'Languages, frameworks, tools you use' },
  { label: 'Current Company', hint: 'Team, product, your role there' },
  { label: 'Salary & Goals',  hint: 'Target comp, location, timeline' },
]

export default function Onboarding({ onComplete }: Props) {
  const [name, setName] = useState('')
  const [step, setStep] = useState<'name' | 'context'>('name')
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [snippets, setSnippets] = useState<{ label: string; content: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const submitName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setStep('context')
  }

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setContent(text)
    setFileName(file.name)
  }

  const addCurrent = () => {
    if (!selected || !content.trim()) return
    setSnippets(s => [...s, { label: selected, content }])
    setSelected(null)
    setContent('')
    setFileName(null)
  }

  const finish = async (skip = false) => {
    setSaving(true)
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), contextFiles: [] }),
    })
    if (!skip) {
      const toSave = selected && content.trim() ? [...snippets, { label: selected, content }] : snippets
      for (const s of toSave) {
        await fetch('/api/context-snippets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s),
        })
      }
    }
    router.replace('/')
    onComplete(name.trim())
  }

  const usedLabels = snippets.map(s => s.label)
  const available = SUGGESTIONS.filter(s => !usedLabels.includes(s.label))

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'var(--canvas)' }}>
      <div className="w-full max-w-lg px-6">

        {step === 'name' && (
          <form onSubmit={submitName} className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-[11px] font-medium tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>
                ⚡ UDD — First run
              </p>
              <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>What&apos;s your name?</h1>
              <p className="text-[16px]" style={{ color: 'var(--fg-body)' }}>Your dashboard, your name.</p>
            </div>
            <div className="flex gap-3">
              <input className="dev-input flex-1 text-[16px]" placeholder="e.g. Priya"
                value={name} onChange={e => setName(e.target.value)} autoFocus />
              <button type="submit" disabled={!name.trim()} className="btn btn-md btn-primary" style={{ minWidth: 100 }}>
                Next →
              </button>
            </div>
          </form>
        )}

        {step === 'context' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[11px] font-medium tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>
                ⚡ UDD — Your context
              </p>
              <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>Tell Claude about yourself.</h1>
              <p className="text-[15px]" style={{ color: 'var(--fg-body)' }}>
                This gets read before every skill run — no re-explaining yourself each time. You can skip and add later.
              </p>
            </div>

            {/* Already added */}
            {snippets.length > 0 && (
              <div className="flex flex-col gap-2">
                {snippets.map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-3 px-3 py-2 rounded-[8px]"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>{s.label}</span>
                      <span className="text-[11px] truncate" style={{ color: 'var(--fg-muted)' }}>{s.content.slice(0, 60)}…</span>
                    </div>
                    <button onClick={() => setSnippets(ss => ss.filter(x => x.label !== s.label))}
                      className="btn btn-sm btn-ghost text-[11px] shrink-0" style={{ color: 'var(--destructive)' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Pick a category */}
            {available.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>
                  What would you like to add?
                </p>
                <div className="flex flex-wrap gap-2">
                  {available.map(s => (
                    <button key={s.label} onClick={() => { setSelected(s.label); setContent('') }}
                      className="font-mono text-[11px] px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        background: selected === s.label ? 'rgba(168,85,247,0.2)' : 'var(--elevated)',
                        color: selected === s.label ? 'var(--accent-primary)' : 'var(--fg-muted)',
                        border: `1px solid ${selected === s.label ? 'rgba(168,85,247,0.4)' : 'var(--border-subtle)'}`,
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {selected && (
                  <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                    {SUGGESTIONS.find(s => s.label === selected)?.hint}
                  </p>
                )}
              </div>
            )}

            {/* File picker — shows when a category is selected */}
            {selected && (
              <div className="flex flex-col gap-3">
                <input ref={fileRef} type="file" accept=".md,.txt,.pdf,.doc,.docx" className="hidden" onChange={pickFile} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 rounded-[12px] px-4 py-4 text-[14px] transition-colors"
                  style={{
                    background: fileName ? 'rgba(168,85,247,0.1)' : 'var(--elevated)',
                    border: `2px dashed ${fileName ? 'rgba(168,85,247,0.5)' : 'var(--border-subtle)'}`,
                    color: fileName ? 'var(--accent-primary)' : 'var(--fg-muted)',
                  }}
                >
                  <span style={{ fontSize: 20 }}>📄</span>
                  <span>{fileName ? fileName : `Select your ${selected.toLowerCase()} file…`}</span>
                </button>
                {content && (
                  <p className="font-mono text-[11px]" style={{ color: '#10b981' }}>
                    ✓ {content.length.toLocaleString()} chars — Claude will read this every run
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setSelected(null); setContent(''); setFileName(null) }} className="btn btn-sm btn-ghost flex-1">Cancel</button>
                  <button onClick={addCurrent} disabled={!content.trim()} className="btn btn-sm btn-primary flex-1">Add →</button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => finish(true)} className="btn btn-md btn-ghost flex-1">
                {snippets.length > 0 ? 'Skip rest' : 'Skip for now'}
              </button>
              <button onClick={() => finish(false)} disabled={saving || (snippets.length === 0 && !content.trim())}
                className="btn btn-md btn-primary flex-1">
                {saving ? 'Saving…' : `Let's go, ${name} →`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
