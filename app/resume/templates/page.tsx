'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EyebrowLabel from '@/components/EyebrowLabel'

interface Template {
  id: number; name: string; category: string; description: string
  guidelines: string; is_builtin: number; created_at: string
}

// ── SVG layout preview thumbnails ────────────────────────────────
// Each one draws a miniature resume structure using placeholder blocks/lines.

function PreviewSingleClean({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Name block — centered */}
      <rect x="25" y="10" width="70" height="7" rx="2" fill={accent} opacity={0.9} />
      <rect x="35" y="20" width="50" height="3" rx="1.5" fill={accent} opacity={0.4} />
      <line x1="10" y1="29" x2="110" y2="29" stroke={accent} strokeWidth="0.5" opacity={0.3} />
      {/* Section: Experience */}
      <rect x="10" y="34" width="28" height="2.5" rx="1" fill={accent} opacity={0.7} />
      <rect x="10" y="40" width="55" height="2" rx="1" fill={accent} opacity={0.3} />
      <rect x="10" y="44" width="90" height="1.5" rx="1" fill={accent} opacity={0.15} />
      <rect x="10" y="47" width="85" height="1.5" rx="1" fill={accent} opacity={0.15} />
      <rect x="10" y="50" width="78" height="1.5" rx="1" fill={accent} opacity={0.15} />
      <rect x="10" y="56" width="55" height="2" rx="1" fill={accent} opacity={0.3} />
      <rect x="10" y="60" width="90" height="1.5" rx="1" fill={accent} opacity={0.15} />
      <rect x="10" y="63" width="82" height="1.5" rx="1" fill={accent} opacity={0.15} />
      {/* Section: Education */}
      <line x1="10" y1="72" x2="110" y2="72" stroke={accent} strokeWidth="0.3" opacity={0.2} />
      <rect x="10" y="75" width="26" height="2.5" rx="1" fill={accent} opacity={0.7} />
      <rect x="10" y="81" width="60" height="2" rx="1" fill={accent} opacity={0.3} />
      <rect x="10" y="85" width="45" height="1.5" rx="1" fill={accent} opacity={0.15} />
      {/* Section: Skills */}
      <line x1="10" y1="94" x2="110" y2="94" stroke={accent} strokeWidth="0.3" opacity={0.2} />
      <rect x="10" y="97" width="18" height="2.5" rx="1" fill={accent} opacity={0.7} />
      <rect x="10" y="103" width="20" height="4" rx="2" fill={accent} opacity={0.2} />
      <rect x="33" y="103" width="22" height="4" rx="2" fill={accent} opacity={0.2} />
      <rect x="58" y="103" width="18" height="4" rx="2" fill={accent} opacity={0.2} />
      <rect x="79" y="103" width="24" height="4" rx="2" fill={accent} opacity={0.2} />
      <rect x="10" y="110" width="24" height="4" rx="2" fill={accent} opacity={0.2} />
      <rect x="37" y="110" width="19" height="4" rx="2" fill={accent} opacity={0.2} />
    </svg>
  )
}

function PreviewSidebar({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Sidebar background */}
      <rect x="0" y="0" width="35" height="160" rx="0" fill={accent} opacity={0.08} />
      {/* Sidebar content */}
      <rect x="5" y="12" width="25" height="25" rx="12.5" fill={accent} opacity={0.2} />
      <rect x="5" y="41" width="25" height="2" rx="1" fill={accent} opacity={0.5} />
      <rect x="5" y="45" width="22" height="1.5" rx="1" fill={accent} opacity={0.25} />
      <rect x="5" y="49" width="20" height="1.5" rx="1" fill={accent} opacity={0.25} />
      <line x1="5" y1="57" x2="30" y2="57" stroke={accent} strokeWidth="0.3" opacity={0.3} />
      <rect x="5" y="60" width="16" height="2" rx="1" fill={accent} opacity={0.6} />
      <rect x="5" y="65" width="22" height="3" rx="1.5" fill={accent} opacity={0.18} />
      <rect x="5" y="70" width="18" height="3" rx="1.5" fill={accent} opacity={0.18} />
      <rect x="5" y="75" width="24" height="3" rx="1.5" fill={accent} opacity={0.18} />
      <rect x="5" y="80" width="20" height="3" rx="1.5" fill={accent} opacity={0.18} />
      <line x1="5" y1="89" x2="30" y2="89" stroke={accent} strokeWidth="0.3" opacity={0.3} />
      <rect x="5" y="92" width="20" height="2" rx="1" fill={accent} opacity={0.6} />
      <rect x="5" y="97" width="22" height="1.5" rx="1" fill={accent} opacity={0.2} />
      <rect x="5" y="101" width="18" height="1.5" rx="1" fill={accent} opacity={0.2} />
      {/* Main content */}
      <rect x="42" y="10" width="60" height="6" rx="2" fill={accent} opacity={0.85} />
      <rect x="42" y="19" width="42" height="2" rx="1" fill={accent} opacity={0.35} />
      <line x1="42" y1="26" x2="112" y2="26" stroke={accent} strokeWidth="0.4" opacity={0.25} />
      <rect x="42" y="30" width="22" height="2.5" rx="1" fill={accent} opacity={0.7} />
      <rect x="42" y="36" width="50" height="1.5" rx="1" fill={accent} opacity={0.3} />
      <rect x="42" y="40" width="68" height="1.5" rx="1" fill={accent} opacity={0.15} />
      <rect x="42" y="43" width="62" height="1.5" rx="1" fill={accent} opacity={0.15} />
      <rect x="42" y="46" width="70" height="1.5" rx="1" fill={accent} opacity={0.15} />
      <rect x="42" y="52" width="50" height="1.5" rx="1" fill={accent} opacity={0.3} />
      <rect x="42" y="56" width="65" height="1.5" rx="1" fill={accent} opacity={0.15} />
      <rect x="42" y="59" width="68" height="1.5" rx="1" fill={accent} opacity={0.15} />
      <line x1="42" y1="68" x2="112" y2="68" stroke={accent} strokeWidth="0.4" opacity={0.25} />
      <rect x="42" y="72" width="22" height="2.5" rx="1" fill={accent} opacity={0.7} />
      <rect x="42" y="78" width="55" height="1.5" rx="1" fill={accent} opacity={0.3} />
      <rect x="42" y="82" width="48" height="1.5" rx="1" fill={accent} opacity={0.15} />
    </svg>
  )
}

function PreviewModernHeader({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Bold accent header band */}
      <rect x="0" y="0" width="120" height="30" rx="0" fill={accent} opacity={0.18} />
      <rect x="10" y="7" width="50" height="7" rx="2" fill={accent} opacity={0.9} />
      <rect x="10" y="17" width="35" height="2.5" rx="1" fill={accent} opacity={0.5} />
      <rect x="75" y="10" width="35" height="1.5" rx="1" fill={accent} opacity={0.35} />
      <rect x="75" y="14" width="28" height="1.5" rx="1" fill={accent} opacity={0.35} />
      <rect x="75" y="18" width="32" height="1.5" rx="1" fill={accent} opacity={0.35} />
      {/* Accent-colored section labels */}
      <rect x="10" y="36" width="32" height="3" rx="1" fill={accent} opacity={0.8} />
      <rect x="10" y="43" width="55" height="2" rx="1" fill={accent} opacity={0.3} />
      <rect x="10" y="47" width="90" height="1.5" rx="1" fill={accent} opacity={0.12} />
      <rect x="10" y="50" width="85" height="1.5" rx="1" fill={accent} opacity={0.12} />
      <rect x="10" y="53" width="75" height="1.5" rx="1" fill={accent} opacity={0.12} />
      <rect x="10" y="59" width="55" height="2" rx="1" fill={accent} opacity={0.3} />
      <rect x="10" y="63" width="88" height="1.5" rx="1" fill={accent} opacity={0.12} />
      <rect x="10" y="66" width="80" height="1.5" rx="1" fill={accent} opacity={0.12} />
      <rect x="10" y="75" width="32" height="3" rx="1" fill={accent} opacity={0.8} />
      <rect x="10" y="82" width="55" height="2" rx="1" fill={accent} opacity={0.3} />
      <rect x="10" y="86" width="70" height="1.5" rx="1" fill={accent} opacity={0.12} />
      <rect x="10" y="89" width="65" height="1.5" rx="1" fill={accent} opacity={0.12} />
      <rect x="10" y="98" width="22" height="3" rx="1" fill={accent} opacity={0.8} />
      <rect x="10" y="105" width="20" height="4" rx="2" fill={accent} opacity={0.2} />
      <rect x="33" y="105" width="22" height="4" rx="2" fill={accent} opacity={0.2} />
      <rect x="58" y="105" width="18" height="4" rx="2" fill={accent} opacity={0.2} />
      <rect x="79" y="105" width="20" height="4" rx="2" fill={accent} opacity={0.2} />
    </svg>
  )
}

function PreviewMinimal({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Very large name, minimal decoration */}
      <rect x="10" y="14" width="80" height="9" rx="2" fill={accent} opacity={0.85} />
      <rect x="10" y="27" width="55" height="2.5" rx="1" fill={accent} opacity={0.3} />
      {/* Section — just a label, no rule */}
      <rect x="10" y="42" width="22" height="2" rx="1" fill={accent} opacity={0.5} />
      <rect x="10" y="49" width="60" height="2" rx="1" fill={accent} opacity={0.25} />
      <rect x="10" y="55" width="95" height="1.5" rx="1" fill={accent} opacity={0.1} />
      <rect x="10" y="59" width="90" height="1.5" rx="1" fill={accent} opacity={0.1} />
      <rect x="10" y="63" width="85" height="1.5" rx="1" fill={accent} opacity={0.1} />
      <rect x="10" y="73" width="60" height="2" rx="1" fill={accent} opacity={0.25} />
      <rect x="10" y="79" width="93" height="1.5" rx="1" fill={accent} opacity={0.1} />
      <rect x="10" y="83" width="88" height="1.5" rx="1" fill={accent} opacity={0.1} />
      <rect x="10" y="96" width="22" height="2" rx="1" fill={accent} opacity={0.5} />
      <rect x="10" y="103" width="55" height="2" rx="1" fill={accent} opacity={0.25} />
      <rect x="10" y="109" width="40" height="1.5" rx="1" fill={accent} opacity={0.1} />
      <rect x="10" y="120" width="18" height="2" rx="1" fill={accent} opacity={0.5} />
      <rect x="10" y="127" width="90" height="1.5" rx="1" fill={accent} opacity={0.1} />
      <rect x="10" y="131" width="80" height="1.5" rx="1" fill={accent} opacity={0.1} />
    </svg>
  )
}

function PreviewATSSafe({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Plain, center-aligned header */}
      <rect x="30" y="10" width="60" height="5" rx="1.5" fill={accent} opacity={0.8} />
      <rect x="20" y="18" width="80" height="2" rx="1" fill={accent} opacity={0.3} />
      <line x1="10" y1="25" x2="110" y2="25" stroke={accent} strokeWidth="0.8" opacity={0.4} />
      <rect x="10" y="30" width="30" height="2.5" rx="1" fill={accent} opacity={0.7} />
      <line x1="10" y1="35" x2="110" y2="35" stroke={accent} strokeWidth="0.4" opacity={0.2} />
      <rect x="10" y="39" width="55" height="1.5" rx="0" fill={accent} opacity={0.25} />
      <rect x="10" y="43" width="90" height="1.5" rx="0" fill={accent} opacity={0.1} />
      <rect x="10" y="47" width="88" height="1.5" rx="0" fill={accent} opacity={0.1} />
      <rect x="10" y="51" width="82" height="1.5" rx="0" fill={accent} opacity={0.1} />
      <rect x="10" y="58" width="55" height="1.5" rx="0" fill={accent} opacity={0.25} />
      <rect x="10" y="62" width="90" height="1.5" rx="0" fill={accent} opacity={0.1} />
      <rect x="10" y="66" width="85" height="1.5" rx="0" fill={accent} opacity={0.1} />
      <line x1="10" y1="74" x2="110" y2="74" stroke={accent} strokeWidth="0.4" opacity={0.2} />
      <rect x="10" y="78" width="30" height="2.5" rx="1" fill={accent} opacity={0.7} />
      <line x1="10" y1="83" x2="110" y2="83" stroke={accent} strokeWidth="0.4" opacity={0.2} />
      <rect x="10" y="87" width="55" height="1.5" rx="0" fill={accent} opacity={0.25} />
      <rect x="10" y="91" width="60" height="1.5" rx="0" fill={accent} opacity={0.1} />
      <line x1="10" y1="100" x2="110" y2="100" stroke={accent} strokeWidth="0.4" opacity={0.2} />
      <rect x="10" y="104" width="18" height="2.5" rx="1" fill={accent} opacity={0.7} />
      <line x1="10" y1="109" x2="110" y2="109" stroke={accent} strokeWidth="0.4" opacity={0.2} />
      <rect x="10" y="113" width="95" height="1.5" rx="0" fill={accent} opacity={0.1} />
      <rect x="10" y="117" width="90" height="1.5" rx="0" fill={accent} opacity={0.1} />
    </svg>
  )
}

// Maps template name patterns to preview components and layout labels
const LAYOUT_MAP: { match: string; label: string; Preview: React.FC<{ accent: string }> }[] = [
  { match: 'faang', label: 'Single column · metrics-first', Preview: PreviewSingleClean },
  { match: 'startup', label: 'Single column · builder-tone', Preview: PreviewModernHeader },
  { match: 'data', label: 'Single column · projects section', Preview: PreviewSingleClean },
  { match: 'product', label: 'Single column · business metrics', Preview: PreviewModernHeader },
  { match: 'general', label: 'Plain · ATS-safe · no tables', Preview: PreviewATSSafe },
]

function getLayout(name: string) {
  const lower = name.toLowerCase()
  return LAYOUT_MAP.find(l => lower.includes(l.match)) ?? { label: 'Single column', Preview: PreviewMinimal }
}

// ── Page ─────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Tech', 'Product', 'General']
const ACCENT = 'var(--accent-primary)'

export default function ResumeTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState<Template | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('General')
  const [newDesc, setNewDesc] = useState('')
  const [newGuidelines, setNewGuidelines] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => fetch('/api/resume-templates').then(r => r.json()).then(setTemplates)
  useEffect(() => { load() }, [])

  const filtered = activeCategory === 'All' ? templates : templates.filter(t => t.category === activeCategory)

  const saveNew = async () => {
    if (!newName.trim() || !newGuidelines.trim()) return
    setSaving(true)
    await fetch('/api/resume-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, category: newCategory, description: newDesc, guidelines: newGuidelines }),
    })
    setSaving(false)
    setShowNew(false); setNewName(''); setNewCategory('General'); setNewDesc(''); setNewGuidelines('')
    load()
  }

  const deleteTemplate = async (id: number) => {
    await fetch('/api/resume-templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (selected?.id === id) setSelected(null)
    load()
  }

  const useTemplate = (t: Template) => {
    const slug = t.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    router.push(`/?skill=resume-update&args=template:${slug}`)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      <header className="mx-auto max-w-6xl flex flex-col gap-4 px-6 py-16 md:py-20">
        <div className="flex items-center gap-3">
          <Link href="/resume" className="font-mono text-[13px]" style={{ color: 'var(--fg-muted)' }}>← Resumes</Link>
        </div>
        <EyebrowLabel>Resume Templates</EyebrowLabel>
        <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>Pick a format.</h1>
        <p className="max-w-2xl text-lg" style={{ color: 'var(--fg-body)' }}>
          Each template includes a visual layout preview and industry-specific formatting rules injected into the resume builder.
          Or write your own guideline set.
        </p>
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      <section className="mx-auto max-w-6xl px-6 py-10">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className="font-mono text-[12px] px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: activeCategory === c ? 'var(--accent-primary)' : 'var(--elevated)',
                  color: activeCategory === c ? '#fff' : 'var(--fg-muted)',
                  border: '1px solid var(--border-subtle)',
                }}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNew(true)} className="btn btn-md btn-primary text-[13px] px-4 py-2">
            + New template
          </button>
        </div>

        {/* Template visual grid */}
        {!selected ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(t => {
              const layout = getLayout(t.name)
              const { Preview } = layout
              return (
                <button key={t.id} onClick={() => setSelected(t)}
                  className="text-left flex flex-col rounded-[20px] overflow-hidden transition-all hover:scale-[1.02] group"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>

                  {/* Visual preview area */}
                  <div className="relative flex items-center justify-center overflow-hidden"
                    style={{ height: 200, background: 'var(--canvas)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: '76%', height: '86%' }}>
                      <Preview accent={ACCENT} />
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.55)' }}>
                      <span className="font-mono text-[12px] px-4 py-2 rounded-full"
                        style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                        Preview →
                      </span>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="px-4 py-3 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--fg)' }}>{t.name}</p>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
                        style={{ background: 'var(--elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
                        {t.category}
                      </span>
                    </div>
                    <p className="font-mono text-[10px]" style={{ color: 'var(--fg-muted)' }}>{layout.label}</p>
                  </div>
                </button>
              )
            })}

            {/* Add custom card */}
            <button onClick={() => setShowNew(true)}
              className="flex flex-col items-center justify-center gap-3 rounded-[20px] transition-all hover:scale-[1.02]"
              style={{ height: '100%', minHeight: 260, background: 'var(--canvas)', border: '1.5px dashed var(--border-subtle)' }}>
              <span className="text-[28px]">＋</span>
              <div className="text-center px-4">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>Custom template</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--fg-muted)' }}>Paste any guideline set — from a recruiter, careers page, or your own rules</p>
              </div>
            </button>

            {filtered.length === 0 && (
              <p className="col-span-4 text-[14px]" style={{ color: 'var(--fg-muted)' }}>No templates in this category.</p>
            )}
          </div>
        ) : (
          /* Detail view — back to grid */
          <div className="flex flex-col gap-6">
            <button onClick={() => setSelected(null)} className="flex items-center gap-2 font-mono text-[12px] w-fit"
              style={{ color: 'var(--fg-muted)' }}>
              ← All templates
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Large preview */}
              <div className="flex flex-col gap-4">
                <div className="rounded-[20px] overflow-hidden flex items-center justify-center"
                  style={{ height: 420, background: 'var(--canvas)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: '65%', height: '85%' }}>
                    {(() => { const { Preview } = getLayout(selected.name); return <Preview accent={ACCENT} /> })()}
                  </div>
                </div>
                <p className="font-mono text-[11px] text-center" style={{ color: 'var(--fg-muted)' }}>
                  {getLayout(selected.name).label}
                </p>
              </div>

              {/* Info + actions */}
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--accent-primary)' }}>
                      {selected.category}
                    </p>
                    <h2 className="text-[22px] font-bold" style={{ color: 'var(--fg)' }}>{selected.name}</h2>
                    {selected.description && (
                      <p className="text-[14px] mt-1" style={{ color: 'var(--fg-muted)' }}>{selected.description}</p>
                    )}
                  </div>
                  {selected.is_builtin === 0 && (
                    <button onClick={() => deleteTemplate(selected.id)}
                      className="font-mono text-[11px] px-3 py-1.5 rounded-[8px] shrink-0"
                      style={{ color: 'var(--destructive)', border: '1px solid var(--border-subtle)' }}>
                      Delete
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => useTemplate(selected)} className="btn btn-md btn-primary flex-1 text-[14px]">
                    Use this template →
                  </button>
                  <Link href="/?skill=resume-update"
                    className="btn btn-md btn-ghost flex-1 text-[14px] text-center">
                    Builder (no template)
                  </Link>
                </div>

                <div className="rounded-[14px] overflow-hidden"
                  style={{ border: '1px solid var(--border-subtle)' }}>
                  <div className="px-4 py-2 border-b flex items-center justify-between"
                    style={{ background: 'var(--elevated)', borderColor: 'var(--border-subtle)' }}>
                    <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>
                      Format guidelines injected into builder
                    </span>
                  </div>
                  <pre className="px-4 py-4 text-[11px] leading-relaxed overflow-auto whitespace-pre-wrap"
                    style={{ background: 'var(--canvas)', color: 'var(--fg-body)', maxHeight: 280 }}>
                    {selected.guidelines}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* New template modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowNew(false) }}>
          <div className="w-full max-w-xl rounded-[20px] p-6 flex flex-col gap-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>New template</h3>
              <button onClick={() => setShowNew(false)} className="font-mono text-[12px]" style={{ color: 'var(--fg-muted)' }}>✕</button>
            </div>
            <input className="dev-input text-[14px]" placeholder="Template name" value={newName} onChange={e => setNewName(e.target.value)} />
            <div className="flex gap-3">
              <input className="dev-input text-[14px] flex-1" placeholder="Category (Tech, Product, General…)" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
              <input className="dev-input text-[14px] flex-1" placeholder="Short description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            </div>
            <textarea className="dev-input text-[13px] resize-none" rows={9}
              placeholder={`Write or paste your formatting guidelines.\n\nExample:\n- Length: 1 page max\n- Bullets: STAR format\n- Always include metrics per role\n- Keywords to hit: …`}
              value={newGuidelines} onChange={e => setNewGuidelines(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={saveNew} disabled={saving || !newName.trim() || !newGuidelines.trim()}
                className="btn btn-md btn-primary flex-1">
                {saving ? 'Saving…' : 'Save template'}
              </button>
              <button onClick={() => setShowNew(false)} className="btn btn-md btn-ghost flex-1">Cancel</button>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
              Guidelines are injected at the start of every /resume-update session when you select this template.
              You can paste any source — a recruiter tip sheet, company careers page, or your own rules.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
