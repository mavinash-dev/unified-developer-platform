'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'home' | 'image' | 'text' | 'url'
type Stage = 'idle' | 'extracting' | 'done' | 'error'

interface Extracted {
  company?: string
  role?: string
  location?: string
  remote?: boolean
  salary_range?: string
  jd_summary?: string
  key_skills?: string[]
}

function fmt(e: Extracted) {
  return [e.company, e.role, e.location].filter(Boolean).join(' · ')
}

export default function DropPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('home')
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [extracted, setExtracted] = useState<Extracted | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => { setMode('home'); setStage('idle'); setError(''); setExtracted(null); setPreview(null) }

  const handleExtracted = (data: Extracted & { error?: string }) => {
    if (data.error) { setError(data.error); setStage('error'); return }
    setExtracted(data)
    setStage('done')
  }

  const extractText = async () => {
    const input = (mode === 'url' ? url : text).trim()
    if (!input) return
    setStage('extracting')
    setError('')
    try {
      const res = await fetch('/api/tracker/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'url' ? { url: input } : { text: input }),
      })
      handleExtracted(await res.json())
    } catch (e) { setError((e as Error).message); setStage('error') }
  }

  const extractImage = async (file: File) => {
    setPreview(URL.createObjectURL(file))
    setStage('extracting')
    setError('')
    const form = new FormData()
    form.append('image', file)
    try {
      const res = await fetch('/api/tracker/ingest-image', { method: 'POST', body: form })
      handleExtracted(await res.json())
    } catch (e) { setError((e as Error).message); setStage('error') }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) extractImage(file)
  }

  const saveAndGo = async () => {
    if (!extracted?.company || !extracted?.role) return
    await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: extracted.company,
        role: extracted.role,
        location: extracted.location ?? '',
        remote: extracted.remote ?? false,
        salary_range: extracted.salary_range ?? '',
        jd_summary: extracted.jd_summary ?? '',
        key_skills: extracted.key_skills ?? [],
        contacts: [],
      }),
    })
    router.push('/tracker')
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--canvas)', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Header */}
      <div
        className="px-5 py-5 flex items-center justify-between border-b sticky top-0 z-10"
        style={{ background: 'var(--canvas)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-bold" style={{ color: 'var(--accent-primary)' }}>⚡ UDD</span>
          <span className="font-mono text-[11px]" style={{ color: 'var(--fg-muted)' }}>/ Drop Zone</span>
        </div>
        {mode !== 'home' && (
          <button onClick={reset} className="font-mono text-[12px]" style={{ color: 'var(--fg-muted)' }}>← back</button>
        )}
      </div>

      <div className="flex-1 flex flex-col px-5 py-8 gap-6">

        {/* ── Home ── */}
        {mode === 'home' && (
          <>
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--fg-muted)' }}>Add job to tracker</p>
              <h1 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
                What do you have?
              </h1>
            </div>

            <div className="flex flex-col gap-3">
              {/* Screenshot */}
              <button
                onClick={() => { setMode('image'); setTimeout(() => fileRef.current?.click(), 50) }}
                className="w-full flex items-center gap-5 rounded-[18px] px-6 py-6 text-left transition-all active:scale-[0.98]"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1.5px solid rgba(168,85,247,0.35)' }}
              >
                <span className="text-[36px]">📸</span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>Screenshot</p>
                  <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Photo from camera roll or Files</p>
                </div>
              </button>

              {/* URL */}
              <button
                onClick={() => setMode('url')}
                className="w-full flex items-center gap-5 rounded-[18px] px-6 py-6 text-left transition-all active:scale-[0.98]"
                style={{ background: 'rgba(61,157,255,0.12)', border: '1.5px solid rgba(61,157,255,0.35)' }}
              >
                <span className="text-[36px]">🔗</span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>Job URL</p>
                  <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Paste a LinkedIn, Greenhouse, Lever link</p>
                </div>
              </button>

              {/* Text paste */}
              <button
                onClick={() => setMode('text')}
                className="w-full flex items-center gap-5 rounded-[18px] px-6 py-6 text-left transition-all active:scale-[0.98]"
                style={{ background: 'rgba(16,185,129,0.10)', border: '1.5px solid rgba(16,185,129,0.3)' }}
              >
                <span className="text-[36px]">📋</span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>Job description text</p>
                  <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Paste copied JD text</p>
                </div>
              </button>
            </div>

            <p className="text-center font-mono text-[11px]" style={{ color: 'var(--fg-muted)', opacity: 0.5 }}>
              Claude extracts all details automatically
            </p>
          </>
        )}

        {/* ── Image mode ── */}
        {mode === 'image' && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileChange}
            />

            {stage === 'idle' && (
              <div className="flex flex-col gap-4">
                <h2 className="text-[22px] font-semibold" style={{ color: 'var(--fg)' }}>Screenshot</h2>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-[18px] py-16 flex flex-col items-center gap-3 border-2 border-dashed transition-all"
                  style={{ borderColor: 'rgba(168,85,247,0.4)', background: 'rgba(168,85,247,0.06)' }}
                >
                  <span className="text-[48px]">📸</span>
                  <p className="text-[16px] font-medium" style={{ color: 'var(--fg-body)' }}>Tap to choose image</p>
                  <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Camera roll, Files, or take a photo</p>
                </button>
              </div>
            )}

            {stage === 'extracting' && (
              <div className="flex flex-col items-center gap-6 py-10">
                {preview && (
                  <img src={preview} alt="Screenshot" className="w-full max-w-xs rounded-[14px] object-cover" style={{ maxHeight: 200 }} />
                )}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
                  <p className="font-mono text-[14px]" style={{ color: 'var(--fg-muted)' }}>Claude is reading the screenshot…</p>
                </div>
              </div>
            )}

            {stage === 'error' && error.includes('ANTHROPIC_API_KEY') && (
              <div className="flex flex-col gap-4 rounded-[14px] p-5" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <p className="text-[15px] font-semibold" style={{ color: '#f59e0b' }}>Screenshot parsing needs an API key</p>
                <p className="text-[13px]" style={{ color: 'var(--fg-body)' }}>
                  Add <code className="font-mono px-1 rounded" style={{ background: 'var(--elevated)' }}>ANTHROPIC_API_KEY=sk-ant-...</code> to{' '}
                  <code className="font-mono">.env.local</code> in the UDD project and restart the server.
                </p>
                <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                  You can still add the job via URL or pasted text — those use the Claude CLI you already have.
                </p>
                <button onClick={() => { setMode('url'); setStage('idle') }} className="btn btn-md btn-primary w-full mt-1">
                  Try with URL instead →
                </button>
              </div>
            )}

            {stage === 'error' && !error.includes('ANTHROPIC_API_KEY') && (
              <div className="flex flex-col gap-3">
                <p className="text-[14px]" style={{ color: 'var(--destructive)' }}>{error}</p>
                <button onClick={() => { setStage('idle'); setPreview(null) }} className="btn btn-md btn-ghost w-full">Try again</button>
              </div>
            )}
          </>
        )}

        {/* ── URL / Text mode ── */}
        {(mode === 'url' || mode === 'text') && stage !== 'done' && (
          <>
            <h2 className="text-[22px] font-semibold" style={{ color: 'var(--fg)' }}>
              {mode === 'url' ? 'Paste job URL' : 'Paste job description'}
            </h2>

            {mode === 'url' ? (
              <input
                className="dev-input text-[15px] py-4"
                placeholder="https://linkedin.com/jobs/view/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                type="url"
                autoFocus
              />
            ) : (
              <textarea
                className="dev-input text-[14px] resize-none"
                rows={8}
                placeholder="Paste the full job description here…"
                value={text}
                onChange={e => setText(e.target.value)}
                autoFocus
              />
            )}

            {stage === 'extracting' && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin shrink-0" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
                <p className="font-mono text-[13px]" style={{ color: 'var(--fg-muted)' }}>Extracting with Claude…</p>
              </div>
            )}

            {stage === 'error' && (
              <p className="text-[13px]" style={{ color: 'var(--destructive)' }}>{error}</p>
            )}

            <button
              onClick={extractText}
              disabled={!(mode === 'url' ? url : text).trim() || stage === 'extracting'}
              className="btn btn-md btn-primary w-full text-[16px] py-4"
              style={{ borderRadius: 14 }}
            >
              {stage === 'extracting' ? 'Extracting…' : '⚡ Extract job details'}
            </button>
          </>
        )}

        {/* ── Done / confirmation ── */}
        {stage === 'done' && extracted && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#10b981' }}>✓ Extracted</p>
              <h2 className="text-[22px] font-semibold" style={{ color: 'var(--fg)' }}>{extracted.role}</h2>
              <p className="text-[16px]" style={{ color: 'var(--fg-muted)' }}>{extracted.company}</p>
            </div>

            <div className="rounded-[14px] p-4 flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
              {extracted.location && (
                <Row label="Location" value={`${extracted.location}${extracted.remote ? ' · Remote' : ''}`} />
              )}
              {extracted.salary_range && <Row label="Salary" value={extracted.salary_range} />}
              {(extracted.key_skills ?? []).length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Skills</span>
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {(extracted.key_skills ?? []).map(s => (
                      <span key={s} className="font-mono text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {extracted.jd_summary && (
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Summary</span>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-body)' }}>{extracted.jd_summary}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={saveAndGo} className="btn btn-md btn-primary w-full text-[16px] py-4" style={{ borderRadius: 14 }}>
                Add to tracker →
              </button>
              <button onClick={reset} className="btn btn-md btn-ghost w-full">
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-widest shrink-0" style={{ color: 'var(--fg-muted)' }}>{label}</span>
      <span className="text-[13px] text-right" style={{ color: 'var(--fg-body)' }}>{value}</span>
    </div>
  )
}
