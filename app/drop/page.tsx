'use client'
import { useState, useRef, useEffect } from 'react'
import Spinner from '@/components/Spinner'
import { useRouter, useSearchParams } from 'next/navigation'

type Stage = 'idle' | 'extracting' | 'done' | 'error'

interface LogEntry { ts: string; msg: string; type: 'info' | 'ok' | 'err' }
function ts() { return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) }

interface Extracted {
  company?: string
  role?: string
  location?: string
  remote?: boolean
  salary_range?: string
  jd_summary?: string
  key_skills?: string[]
  _source?: string
}

interface DupEntry { id: number; company: string; role: string; status: string; source: string }

interface BatchItem {
  file: File
  name: string
  stage: Stage
  extracted?: Extracted
  error?: string
  dup?: { existing: DupEntry[] }
  saved?: boolean
  savedId?: number
}

const ACCEPT = 'image/*,.pdf,.doc,.docx,.txt,.md'

// ── Shared helpers ─────────────────────────────────────────────

async function ingestFile(file: File): Promise<Extracted & { error?: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/tracker/ingest-image', { method: 'POST', body: form })
  return res.json()
}

async function ingestText(payload: { text?: string; url?: string }): Promise<Extracted & { error?: string }> {
  const res = await fetch('/api/tracker/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

async function saveToTracker(extracted: Extracted, source: string, force: boolean): Promise<{ duplicate?: boolean; existing?: DupEntry[]; id?: number } | null> {
  const res = await fetch('/api/tracker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company: extracted.company, role: extracted.role,
      location: extracted.location ?? '', remote: extracted.remote ?? false,
      salary_range: extracted.salary_range ?? '', jd_summary: extracted.jd_summary ?? '',
      key_skills: extracted.key_skills ?? [], contacts: [], source, force,
    }),
  })
  if (res.status === 409) return res.json()
  const data = await res.json()
  return { id: data.id }
}

// ── Main page ──────────────────────────────────────────────────

export default function DropPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // ?mobile=1 in the QR URL guarantees phone gets mobile view regardless of UA
  const isMobileParam = searchParams.get('mobile') === '1'
  const [isMobileUA, setIsMobileUA] = useState(false)

  useEffect(() => {
    setIsMobileUA(window.innerWidth < 640 || /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent))
  }, [])

  const showMobile = isMobileParam || isMobileUA

  return showMobile ? <MobileDrop router={router} /> : <DesktopDrop router={router} />
}

// ═══════════════════════════════════════════════════════════════
// MOBILE VIEW — streamlined, full-screen, camera-first
// ═══════════════════════════════════════════════════════════════

// Mobile = pure relay. User's only job: pick a file or paste a URL.
// Server handles OCR + extraction + dedup + tracker creation automatically.
function MobileDrop({ router }: { router: ReturnType<typeof useRouter> }) {
  const [stage, setStage] = useState<'idle' | 'sending' | 'done' | 'skipped' | 'error'>('idle')
  const [result, setResult] = useState<{ company?: string; role?: string; id?: number; existing?: { company: string; role: string; status: string } } | null>(null)
  const [error, setError] = useState('')
  const [urlMode, setUrlMode] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [urlText, setUrlText] = useState('')
  const [pasteText, setPasteText] = useState('')

  const reset = () => { setStage('idle'); setResult(null); setError(''); setUrlMode(false); setPasteMode(false); setUrlText(''); setPasteText('') }

  const sendFile = async (file: File) => {
    setStage('sending')
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/tracker/ingest-and-save', { method: 'POST', body: form })
      const data = await res.json()
      if (data.ok) { setResult({ company: data.company, role: data.role, id: data.id }); setStage('done') }
      else if (data.skipped) { setResult({ company: data.extracted?.company, role: data.extracted?.role, existing: data.existing }); setStage('skipped') }
      else { setError(data.error ?? 'Something went wrong'); setStage('error') }
    } catch (e) { setError((e as Error).message); setStage('error') }
  }

  const sendUrl = async () => {
    if (!urlText.trim()) return
    setStage('sending')
    setError('')
    try {
      const extracted = await ingestText({ url: urlText.trim() })
      if (extracted.error || !extracted.company || !extracted.role) {
        setError(extracted.error ?? 'Could not extract job details from URL'); setStage('error'); return
      }
      const conflict = await saveToTracker(extracted, 'mobile-url', false)
      if (conflict?.duplicate) {
        setResult({ company: extracted.company, role: extracted.role, existing: conflict.existing?.[0] as { company: string; role: string; status: string } })
        setStage('skipped')
      } else {
        setResult({ company: extracted.company, role: extracted.role }); setStage('done')
      }
    } catch (e) { setError((e as Error).message); setStage('error') }
  }

  const sendPaste = async () => {
    if (!pasteText.trim()) return
    setStage('sending')
    setError('')
    try {
      const extracted = await ingestText({ text: pasteText.trim() })
      if (extracted.error || !extracted.company || !extracted.role) {
        setError(extracted.error ?? 'Could not extract job details from text'); setStage('error'); return
      }
      const conflict = await saveToTracker(extracted, 'mobile-paste', false)
      if (conflict?.duplicate) {
        setResult({ company: extracted.company, role: extracted.role, existing: conflict.existing?.[0] as { company: string; role: string; status: string } })
        setStage('skipped')
      } else {
        setResult({ company: extracted.company, role: extracted.role }); setStage('done')
      }
    } catch (e) { setError((e as Error).message); setStage('error') }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--canvas)' }}>
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="font-mono text-[13px] font-bold" style={{ color: 'var(--accent-primary)' }}>⚡ UDD / Drop Zone</span>
        {stage !== 'idle' && <button onClick={reset} className="font-mono text-[12px]" style={{ color: 'var(--fg-muted)' }}>✕ reset</button>}
      </div>

      <div className="flex-1 flex flex-col px-5 py-8 gap-5">

        {/* ── Idle ── */}
        {stage === 'idle' && !urlMode && !pasteMode && (
          <>
            {/* Header */}
            <div className="flex flex-col gap-1 pb-2">
              <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: DROP_SOLID }}>Drop Zone</p>
              <h1 className="text-sub-small" style={{ color: 'var(--fg)' }}>Send a job.</h1>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>Pick a file — laptop does the rest.</p>
            </div>

            {/* Primary upload CTA — full bleed, deep visual weight */}
            <label
              className="relative flex flex-col items-center justify-center gap-4 rounded-[24px] py-10 active:scale-[0.98] cursor-pointer overflow-hidden"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 0 0 1px rgba(168,85,247,0.05) inset, 0 20px 40px rgba(0,0,0,0.25)',
              }}
            >
              <input type="file" accept={ACCEPT}
                onChange={e => { const f = e.target.files?.[0]; if (f) sendFile(f); e.target.value = '' }}
                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              {/* Ambient glow */}
              <div className="absolute rounded-full pointer-events-none"
                style={{ width: 180, height: 180, background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)', filter: 'blur(20px)' }} />
              <div className="relative flex items-center justify-center rounded-[18px]"
                style={{ width: 64, height: 64, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
                <span style={{ fontSize: 30 }}>📎</span>
              </div>
              <div className="relative text-center">
                <p className="text-[16px] font-semibold" style={{ color: 'var(--fg)' }}>Choose a file</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--fg-muted)' }}>Screenshot · PDF · Word · text</p>
              </div>
            </label>

            {/* 3-tile row: URL + Paste */}
            <div className="flex gap-3">
              <button onClick={() => setUrlMode(true)}
                className="flex-1 flex flex-col items-center gap-2.5 py-5 rounded-[18px] active:scale-[0.97] cursor-pointer"
                style={{ background: DROP_BG, border: `1px solid ${DROP_RING}` }}>
                <span style={{ fontSize: 22 }}>🔗</span>
                <div className="text-center">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>URL</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>LinkedIn etc.</p>
                </div>
              </button>

              <button onClick={() => { setUrlMode(false); setPasteMode(true) }}
                className="flex-1 flex flex-col items-center gap-2.5 py-5 rounded-[18px] active:scale-[0.97] cursor-pointer"
                style={{ background: DROP_BG, border: `1px solid ${DROP_RING}` }}>
                <span style={{ fontSize: 22 }}>📋</span>
                <div className="text-center">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>Paste</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>JD text</p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── URL mode ── */}
        {stage === 'idle' && urlMode && (
          <>
            <h2 className="text-[22px] font-semibold" style={{ color: 'var(--fg)' }}>Paste job URL</h2>
            <input className="dev-input text-[15px] py-4" type="url" autoFocus
              placeholder="https://linkedin.com/jobs/view/..."
              value={urlText} onChange={e => setUrlText(e.target.value)} />
            <button onClick={sendUrl} disabled={!urlText.trim()} className="btn btn-md btn-primary w-full text-[16px] py-4" style={{ borderRadius: 14 }}>
              ⚡ Send to tracker
            </button>
            <button onClick={() => setUrlMode(false)} className="btn btn-md btn-ghost w-full">← back</button>
          </>
        )}

        {/* ── Paste mode ── */}
        {stage === 'idle' && pasteMode && (
          <>
            <h2 className="text-[22px] font-semibold" style={{ color: 'var(--fg)' }}>Paste job description</h2>
            <textarea className="dev-input text-[14px] py-3 resize-none" autoFocus rows={8}
              placeholder="Paste the full job description here…"
              value={pasteText} onChange={e => setPasteText(e.target.value)} />
            <button onClick={sendPaste} disabled={!pasteText.trim()} className="btn btn-md btn-primary w-full text-[16px] py-4" style={{ borderRadius: 14 }}>
              ⚡ Send to tracker
            </button>
            <button onClick={() => setPasteMode(false)} className="btn btn-md btn-ghost w-full">← back</button>
          </>
        )}

        {/* ── Sending ── */}
        {stage === 'sending' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <Spinner size="lg" />
            <div className="flex flex-col items-center gap-1">
              <p className="text-[14px] font-medium" style={{ color: 'var(--fg)' }}>Sending to laptop…</p>
              <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>OCR → extract → save — you can close this tab</p>
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {stage === 'done' && result && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
            <span className="text-[64px]">✅</span>
            <div className="flex flex-col gap-1">
              <p className="text-[22px] font-bold" style={{ color: 'var(--fg)' }}>Added to tracker!</p>
              <p className="text-[16px]" style={{ color: 'var(--accent-primary)' }}>{result.role}</p>
              <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>{result.company}</p>
            </div>
            <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Check your laptop — it&apos;s in the tracker now.</p>
            <button onClick={reset} className="btn btn-md btn-ghost mt-2">Send another →</button>
          </div>
        )}

        {/* ── Skipped (duplicate) ── */}
        {stage === 'skipped' && result && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <span className="text-[52px]">⚠️</span>
            <p className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>Already tracked</p>
            <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
              {result.company} — {result.role} is already in your tracker
              {result.existing?.status ? ` (${result.existing.status})` : ''}.
            </p>
            <button onClick={reset} className="btn btn-md btn-primary mt-2">Send a different job →</button>
          </div>
        )}

        {/* ── Error ── */}
        {stage === 'error' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-[14px] p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-[13px]" style={{ color: '#ef4444' }}>{error}</p>
            </div>
            <button onClick={reset} className="btn btn-md btn-primary w-full">Try again</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DESKTOP VIEW — QR panel + multi-file batch + source tagging
// ═══════════════════════════════════════════════════════════════

// Uses app design system — same as landing page
const DROP_BG    = 'var(--surface)'
const DROP_RING  = 'var(--border-subtle)'
const DROP_SOLID = 'var(--accent-primary)'

function DesktopDrop({ router }: { router: ReturnType<typeof useRouter> }) {
  const [localUrl, setLocalUrl] = useState<string | null>(null)
  const [batch, setBatch] = useState<BatchItem[]>([])
  const [singleExtracted, setSingleExtracted] = useState<Extracted | null>(null)
  const [singleStage, setSingleStage] = useState<Stage>('idle')
  const [singleError, setSingleError] = useState('')
  const [singleDup, setSingleDup] = useState<{ existing: DupEntry[] } | null>(null)
  const [mode, setMode] = useState<'home' | 'url' | 'text' | 'batch'>('home')
  const [urlText, setUrlText] = useState('')
  const [textContent, setTextContent] = useState('')
  const [log, setLog] = useState<LogEntry[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
    setLog(prev => [...prev, { ts: ts(), msg, type }])
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }

  useEffect(() => {
    fetch('/api/local-ip').then(r => r.json()).then((d) => {
      setLocalUrl(d.dropUrl)
    }).catch(() => {})
  }, [])

  const reset = () => {
    setMode('home'); setSingleExtracted(null); setSingleStage('idle')
    setSingleError(''); setSingleDup(null); setBatch([])
    setUrlText(''); setTextContent('')
  }

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''
    if (files.length === 1) {
      addLog(`Received file: ${files[0].name} (${(files[0].size / 1024).toFixed(1)} KB)`)
      addLog('Running OCR + Claude extraction…')
      setSingleStage('extracting'); setSingleError(''); setMode('batch')
      ingestFile(files[0]).then(data => {
        if (data.error) { addLog(`Extraction failed: ${data.error}`, 'err'); setSingleError(data.error); setSingleStage('error') }
        else { addLog(`Extracted: ${data.role} @ ${data.company}`, 'ok'); setSingleExtracted(data); setSingleStage('done') }
      }).catch(err => { addLog(`Error: ${err.message}`, 'err'); setSingleError(err.message); setSingleStage('error') })
    } else {
      addLog(`Received ${files.length} files`)
      const items: BatchItem[] = files.map(f => ({ file: f, name: f.name, stage: 'idle' as Stage }))
      setBatch(items)
      setMode('batch')
      processBatch(items)
    }
  }

  const processBatch = async (items: BatchItem[]) => {
    for (let i = 0; i < items.length; i++) {
      addLog(`Processing: ${items[i].name}`)
      setBatch(prev => prev.map((it, idx) => idx === i ? { ...it, stage: 'extracting' } : it))
      try {
        const data = await ingestFile(items[i].file)
        if (data.error) {
          addLog(`Failed: ${items[i].name} — ${data.error}`, 'err')
          setBatch(prev => prev.map((it, idx) => idx === i ? { ...it, stage: 'error', error: data.error } : it))
        } else {
          addLog(`Extracted: ${data.role} @ ${data.company}`, 'ok')
          setBatch(prev => prev.map((it, idx) => idx === i ? { ...it, stage: 'done', extracted: data } : it))
        }
      } catch (e) {
        addLog(`Error: ${(e as Error).message}`, 'err')
        setBatch(prev => prev.map((it, idx) => idx === i ? { ...it, stage: 'error', error: (e as Error).message } : it))
      }
    }
  }

  const extractSingleUrl = async () => {
    const input = (mode === 'url' ? urlText : textContent).trim()
    if (!input) return
    addLog(mode === 'url' ? `Fetching URL: ${input.slice(0, 60)}…` : 'Extracting from pasted text…')
    setSingleStage('extracting'); setSingleError('')
    try {
      const data = await (mode === 'url' ? ingestText({ url: input }) : ingestText({ text: input }))
      if (data.error) { addLog(`Extraction failed: ${data.error}`, 'err'); setSingleError(data.error); setSingleStage('error') }
      else { addLog(`Extracted: ${data.role} @ ${data.company}`, 'ok'); setSingleExtracted(data); setSingleStage('done') }
    } catch (e) { addLog(`Error: ${(e as Error).message}`, 'err'); setSingleError((e as Error).message); setSingleStage('error') }
  }

  const saveSingle = async (force: boolean) => {
    if (!singleExtracted?.company || !singleExtracted?.role) return
    const src = singleExtracted._source ?? 'drop-zone'
    addLog(`Saving to tracker: ${singleExtracted.role} @ ${singleExtracted.company}`)
    const result = await saveToTracker(singleExtracted, src, force)
    if (result?.duplicate && !force) { addLog('Duplicate detected — already in tracker', 'err'); setSingleDup(result as { existing: DupEntry[] }); return }
    addLog('Saved ✓ — opening job page', 'ok')
    router.push(result?.id ? `/tracker/${result.id}` : '/tracker')
  }

  const saveBatchItem = async (idx: number, force: boolean) => {
    const item = batch[idx]
    if (!item.extracted) return
    setBatch(prev => prev.map((it, i) => i === idx ? { ...it, dup: undefined } : it))
    const src = item.extracted._source ?? 'drop-zone'
    addLog(`Saving: ${item.extracted.role} @ ${item.extracted.company}`)
    const conflict = await saveToTracker(item.extracted, src, force)
    if (conflict?.duplicate && !force) {
      addLog('Duplicate — already in tracker', 'err')
      setBatch(prev => prev.map((it, i) => i === idx ? { ...it, dup: conflict as { existing: DupEntry[] } } : it))
      return
    }
    addLog(`Saved ✓`, 'ok')
    setBatch(prev => prev.map((it, i) => i === idx ? { ...it, saved: true, savedId: conflict?.id } : it))
  }

  const saveAllBatch = async () => {
    for (let i = 0; i < batch.length; i++) {
      if (batch[i].stage === 'done' && !batch[i].saved && batch[i].extracted) {
        await saveBatchItem(i, false)
      }
    }
  }

  const allBatchDone = batch.length > 0 && batch.every(it => it.stage !== 'extracting')
  const allBatchSaved = batch.length > 0 && batch.filter(it => it.stage === 'done').every(it => it.saved)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--canvas)', maxWidth: 560, margin: '0 auto' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b sticky top-0 z-10" style={{ background: 'var(--canvas)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/')} className="font-mono text-[13px] font-bold" style={{ color: 'var(--accent-primary)' }}>⚡ UDD</button>
          <span className="font-mono text-[11px]" style={{ color: 'var(--fg-muted)' }}>/ Drop Zone</span>
        </div>
        {mode !== 'home' && (
          <button onClick={reset} className="font-mono text-[12px] px-3 py-1.5 rounded-[8px] hover:bg-white/5 cursor-pointer" style={{ color: 'var(--fg-muted)' }}>← back</button>
        )}
      </div>

      <div className="flex-1 flex flex-col px-6 py-6 gap-6">

        {/* ── HOME ── */}
        {mode === 'home' && (
          <div className="flex flex-col items-center gap-7 py-2">

            {/* Floating QR — no card, just ambient glow + QR + labels */}
            <div className="relative flex flex-col items-center gap-5">
              {/* Ambient glow */}
              <div className="absolute rounded-full pointer-events-none"
                style={{ width: 340, height: 340, top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                  background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 68%)', filter: 'blur(32px)' }} />

              {/* Discoverable badge */}
              <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.22)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: DROP_SOLID }} />
                <span className="font-mono text-[11px]" style={{ color: DROP_SOLID }}>Discoverable on WiFi</span>
              </div>

              {/* QR or spinner */}
              <div className="relative">
                {localUrl ? (
                  <DotQR url={`${localUrl}?mobile=1`} size={200} dotColor="#3b0764" panelBg="#f0ebff" centerText="" />
                ) : (
                  <div className="flex items-center justify-center" style={{ width: 220, height: 220 }}>
                    <Spinner size="md" />
                  </div>
                )}
              </div>

              {/* URL + caption */}
              <div className="relative flex flex-col items-center gap-1.5 text-center">
                <p className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>Scan from your phone</p>
                <p className="font-mono text-[11px] px-3 py-1 rounded-full"
                  style={{ background: 'rgba(168,85,247,0.08)', color: DROP_SOLID, border: '1px solid rgba(168,85,247,0.18)' }}>
                  {localUrl ?? '···'}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>Same WiFi · files auto-save to tracker</p>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
              <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--fg-muted)' }}>or from this machine</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            </div>

            {/* Compact 3-tile row */}
            <div className="flex gap-3 w-full">
              <label className="relative flex-1 flex flex-col items-center gap-2.5 py-5 rounded-[18px] cursor-pointer transition-all hover:scale-[1.02] overflow-hidden"
                style={{ background: DROP_BG, border: `1px solid ${DROP_RING}` }}>
                <input ref={fileRef} type="file" accept={ACCEPT} multiple onChange={onFiles}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                <span className="text-[26px]">📎</span>
                <div className="text-center">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>Files</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>PDF · img · doc</p>
                </div>
              </label>
              <button onClick={() => setMode('url')}
                className="flex-1 flex flex-col items-center gap-2.5 py-5 rounded-[18px] cursor-pointer transition-all hover:scale-[1.02]"
                style={{ background: DROP_BG, border: `1px solid ${DROP_RING}` }}>
                <span className="text-[26px]">🔗</span>
                <div className="text-center">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>URL</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>LinkedIn etc.</p>
                </div>
              </button>
              <button onClick={() => setMode('text')}
                className="flex-1 flex flex-col items-center gap-2.5 py-5 rounded-[18px] cursor-pointer transition-all hover:scale-[1.02]"
                style={{ background: DROP_BG, border: `1px solid ${DROP_RING}` }}>
                <span className="text-[26px]">📋</span>
                <div className="text-center">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>Paste</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>JD text</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── URL / TEXT input ── */}
        {(mode === 'url' || mode === 'text') && singleStage !== 'done' && (
          <>
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {mode === 'url' ? 'Paste job URL' : 'Paste job description'}
            </h2>
            {mode === 'url'
              ? <input className="dev-input text-[15px] py-4" type="url" autoFocus placeholder="https://linkedin.com/jobs/view/..." value={urlText} onChange={e => setUrlText(e.target.value)} />
              : <textarea className="dev-input text-[14px] resize-none" rows={8} autoFocus placeholder="Paste the full job description…" value={textContent} onChange={e => setTextContent(e.target.value)} />
            }
            {singleStage === 'extracting' && (
              <div className="flex items-center gap-3">
                <Spinner size="sm" />
                <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Extracting…</p>
              </div>
            )}
            {singleStage === 'error' && <p className="text-[13px]" style={{ color: 'var(--destructive)' }}>{singleError}</p>}
            <button onClick={extractSingleUrl} disabled={!(mode === 'url' ? urlText : textContent).trim() || singleStage === 'extracting'}
              className="btn btn-md btn-primary w-full text-[15px] py-3" style={{ borderRadius: 12 }}>
              {singleStage === 'extracting' ? 'Extracting…' : '⚡ Extract job details'}
            </button>
          </>
        )}

        {/* ── Single file result ── */}
        {mode === 'batch' && batch.length === 0 && singleStage !== 'idle' && (
          <>
            {singleStage === 'extracting' && (
              <div className="flex flex-col items-center gap-4 py-12">
                <Spinner size="md" />
                <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Running OCR + Claude…</p>
              </div>
            )}
            {singleStage === 'error' && (
              <div className="flex flex-col gap-3">
                <div className="rounded-[12px] p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p className="text-[13px]" style={{ color: '#ef4444' }}>{singleError}</p>
                </div>
                <button onClick={reset} className="btn btn-md btn-ghost w-full">Try again</button>
              </div>
            )}
            {singleStage === 'done' && singleExtracted && (
              <SingleResult extracted={singleExtracted} dup={singleDup} onSave={saveSingle} onDiscard={reset} onViewTracker={() => router.push('/tracker')} />
            )}
            {/* Text/URL single done */}
          </>
        )}

        {/* Single done from URL/text */}
        {(mode === 'url' || mode === 'text') && singleStage === 'done' && singleExtracted && (
          <SingleResult extracted={singleExtracted} dup={singleDup} onSave={saveSingle} onDiscard={reset} onViewTracker={() => router.push('/tracker')} />
        )}

        {/* ── Activity log ── */}
        {log.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Activity log</p>
            <div ref={logRef} className="rounded-[12px] p-3 flex flex-col gap-1 overflow-y-auto font-mono text-[11px]"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border-subtle)', maxHeight: 140 }}>
              {log.map((l, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ color: 'var(--fg-muted)', opacity: 0.5, flexShrink: 0 }}>{l.ts}</span>
                  <span style={{ color: l.type === 'ok' ? 'var(--accent-primary)' : l.type === 'err' ? '#ef4444' : 'var(--fg-body)' }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Batch ── */}
        {mode === 'batch' && batch.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sub-small" style={{ color: 'var(--fg)' }}>{batch.length} files</h2>
              {allBatchDone && !allBatchSaved && (
                <button onClick={saveAllBatch} className="btn btn-md btn-primary text-[12px] px-4 py-2">Save all →</button>
              )}
              {allBatchSaved && (
                <button onClick={() => router.push('/tracker')} className="btn btn-md btn-primary text-[12px] px-4 py-2">View tracker →</button>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {batch.map((item, idx) => (
                <BatchCard key={idx} item={item} onSave={(force) => saveBatchItem(idx, force)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────

function SingleResult({ extracted, dup, onSave, onDiscard, onViewTracker }: {
  extracted: Extracted
  dup: { existing: DupEntry[] } | null
  onSave: (force: boolean) => void
  onDiscard: () => void
  onViewTracker: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: DROP_SOLID }}>✓ Extracted</p>
          {extracted._source && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
              via {extracted._source}
            </span>
          )}
        </div>
        <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>{extracted.role}</h2>
        <p className="text-[15px]" style={{ color: 'var(--fg-muted)' }}>{extracted.company}</p>
      </div>
      <div className="rounded-[14px] p-4 flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
        {extracted.location && <KV label="Location" value={`${extracted.location}${extracted.remote ? ' · Remote' : ''}`} />}
        {extracted.salary_range && <KV label="Salary" value={extracted.salary_range} />}
        {(extracted.key_skills ?? []).length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Skills</span>
            <div className="flex flex-wrap gap-1.5">
              {extracted.key_skills!.map(s => (
                <span key={s} className="font-mono text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
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
      {dup && (
        <div className="rounded-[14px] p-4 flex flex-col gap-3" style={{ background: 'rgba(251,191,36,0.08)', border: '1.5px solid rgba(251,191,36,0.3)' }}>
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#f59e0b' }}>⚠ Already tracked</p>
          {dup.existing.map(e => (
            <p key={e.id} className="text-[13px]" style={{ color: 'var(--fg-body)' }}>
              {e.company} · {e.role}
              <span className="font-mono text-[10px] ml-2 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--elevated)', color: 'var(--fg-muted)' }}>{e.status}</span>
              <span className="font-mono text-[10px] ml-1 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--elevated)', color: 'var(--fg-muted)' }}>via {e.source}</span>
            </p>
          ))}
          <button onClick={() => onSave(true)} className="btn btn-md btn-primary w-full">Add anyway (different source)</button>
          <button onClick={onViewTracker} className="btn btn-md btn-ghost w-full">View existing →</button>
        </div>
      )}
      {!dup && (
        <div className="flex flex-col gap-3">
          <button onClick={() => onSave(false)} className="btn btn-md btn-primary w-full text-[15px] py-3" style={{ borderRadius: 12 }}>
            Add to tracker →
          </button>
          <button onClick={onDiscard} className="btn btn-md btn-ghost w-full">Discard</button>
        </div>
      )}
    </div>
  )
}

function BatchCard({ item, onSave }: { item: BatchItem; onSave: (force: boolean) => void }) {
  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="text-[18px]">{fileIcon(item.name)}</span>
        <p className="flex-1 text-[13px] font-medium truncate" style={{ color: 'var(--fg-body)' }}>{item.name}</p>
        <StatusBadge stage={item.stage} saved={item.saved} />
      </div>
      {item.stage === 'done' && item.extracted && (
        <div className="px-4 py-3 flex flex-col gap-2">
          <p className="text-[14px] font-semibold" style={{ color: 'var(--fg)' }}>{item.extracted.role}</p>
          <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            {item.extracted.company}{item.extracted.location ? ` · ${item.extracted.location}` : ''}
          </p>
          {item.extracted.salary_range && (
            <p className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>{item.extracted.salary_range}</p>
          )}
          {item.dup && (
            <div className="rounded-[10px] px-3 py-2 mt-1" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>Already tracked</p>
              <div className="flex gap-2">
                <button onClick={() => onSave(true)} className="btn btn-md btn-primary text-[11px] px-3 py-1.5 flex-1">Add anyway</button>
                <button onClick={() => {}} className="btn btn-md btn-ghost text-[11px] px-3 py-1.5 flex-1">Skip</button>
              </div>
            </div>
          )}
          {!item.saved && !item.dup && (
            <button onClick={() => onSave(false)} className="btn btn-md btn-primary text-[12px] mt-1 w-full">Add to tracker →</button>
          )}
          {item.saved && (
            <a href={item.savedId ? `/tracker/${item.savedId}` : '/tracker'}
              className="btn btn-md btn-primary text-[12px] mt-1 w-full text-center">
              Start application →
            </a>
          )}
        </div>
      )}
      {item.stage === 'error' && (
        <div className="px-4 py-3">
          <p className="text-[12px]" style={{ color: 'var(--destructive)' }}>{item.error ?? 'Extraction failed'}</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ stage, saved }: { stage: Stage; saved?: boolean }) {
  if (saved) return <span className="font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(14,165,233,0.15)', color: DROP_SOLID }}>✓ saved</span>
  if (stage === 'extracting') return <Spinner size="xs" />
  if (stage === 'done') return <span className="font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(14,165,233,0.15)', color: DROP_SOLID }}>ready</span>
  if (stage === 'error') return <span className="font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>error</span>
  return <span className="font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: 'var(--elevated)', color: 'var(--fg-muted)' }}>pending</span>
}

function fileIcon(name: string) {
  if (/\.(pdf)$/i.test(name)) return '📄'
  if (/\.(docx?|odt)$/i.test(name)) return '📝'
  if (/\.(png|jpe?g|webp|gif|heic)$/i.test(name)) return '🖼'
  return '📎'
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-widest shrink-0" style={{ color: 'var(--fg-muted)' }}>{label}</span>
      <span className="text-[13px] text-right" style={{ color: 'var(--fg-body)' }}>{value}</span>
    </div>
  )
}

// Dot-style QR on a light panel — dark modules on light background is the universal
// scannable standard. Dots vary in radius by distance from center (signal-pulse effect).
// Center text uses H error-correction headroom (30% loss tolerance).
// dotColor = dark module color, panelBg = light background behind the QR.
function DotQR({ url, size = 200, dotColor = '#3b0764', panelBg = '#f5f0ff', centerText }: {
  url: string; size?: number; dotColor?: string; panelBg?: string; centerText?: string
}) {
  const [matrix, setMatrix] = useState<{ data: Uint8Array; n: number } | null>(null)

  useEffect(() => {
    import('qrcode').then(QRCode => {
      const qr = QRCode.create(url, { errorCorrectionLevel: 'H' })
      setMatrix({ data: qr.modules.data as Uint8Array, n: qr.modules.size })
    })
  }, [url])

  if (!matrix) return <div style={{ width: size, height: size, borderRadius: 20 }} />

  const { data, n } = matrix
  const mid = n / 2
  const maxDist = Math.sqrt(mid * mid + mid * mid)

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)

  // All dots solid — scanner needs consistent contrast everywhere.
  // Radius still varies slightly for visual interest but never drops below scannable size.
  // Text is rendered ON TOP (no modules cleared) — H-level error correction handles the overlap.
  const dots: React.ReactNode[] = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!data[r * n + c] || isFinder(r, c)) continue
      const dist = Math.sqrt((c + 0.5 - mid) ** 2 + (r + 0.5 - mid) ** 2)
      const t = 1 - dist / maxDist       // 1=center, 0=corner
      const radius = 0.30 + 0.10 * t     // 0.30–0.40, subtle size variation
      dots.push(
        <circle key={`${r}-${c}`} cx={c + 0.5} cy={r + 0.5} r={radius} fill={dotColor} />
      )
    }
  }

  const finders = [{ x: 3.5, y: 3.5 }, { x: n - 3.5, y: 3.5 }, { x: 3.5, y: n - 3.5 }]

  return (
    // Outer wrapper adds padding + rounded card so QR floats cleanly
    <div style={{
      background: panelBg, borderRadius: 20, padding: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(168,85,247,0.12)',
      display: 'inline-block',
    }}>
      <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} style={{ display: 'block' }}>
        {/* Explicit light background — scanners need light field behind dark modules */}
        <rect width={n} height={n} fill={panelBg} />
        {dots}
        {finders.map((f, i) => (
          <g key={i}>
            {/* Standard finder: dark outer 7×7 → light gap 5×5 → dark inner 3×3 */}
            <rect x={f.x - 3.5} y={f.y - 3.5} width={7} height={7} rx={0.4} fill={dotColor} />
            <rect x={f.x - 2.5} y={f.y - 2.5} width={5} height={5} rx={0.2} fill={panelBg} />
            <rect x={f.x - 1.5} y={f.y - 1.5} width={3} height={3} rx={0.2} fill={dotColor} />
          </g>
        ))}
        {centerText && (
          <g>
            {/* Pill background so text floats above dots without removing modules */}
            <rect x={mid - n * 0.40} y={mid - n * 0.08} width={n * 0.80} height={n * 0.16}
              rx={n * 0.04} fill="#7c3aed" opacity={0.95} />
            <text
              x={mid} y={mid}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={n * 0.058}
              fontFamily="ui-monospace, monospace"
              fontWeight="800"
              letterSpacing="0.05"
              fill="#ffffff"
            >
              {centerText}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
