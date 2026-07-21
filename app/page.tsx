'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SkillRunner from '@/components/SkillRunner'
import EyebrowLabel from '@/components/EyebrowLabel'
import Onboarding from '@/components/Onboarding'

interface Skill { id: string; description: string; category: string }
interface TokenStats { daily: { total: number; in: number; out: number }; monthly: { total: number } }

function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 22) return 'Good evening'
  return 'Hey'
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

const ACCENT_CYCLE = [
  { glow: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)', tag: '#a855f7' },
  { glow: 'rgba(61,157,255,0.15)',  border: 'rgba(61,157,255,0.35)',  tag: '#3d9dff' },
  { glow: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)',   tag: '#10b981' },
  { glow: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',   tag: '#f59e0b' },
]

function Hi({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ color }}>{children}</span>
}

function TokenStrip({ tokens }: { tokens: TokenStats | null }) {
  const stats = [
    { label: 'tokens today', value: tokens ? fmt(tokens.daily.total) : '—' },
    { label: 'tokens in', value: tokens ? fmt(tokens.daily.in) : '—' },
    { label: 'tokens out', value: tokens ? fmt(tokens.daily.out) : '—' },
    { label: 'this month', value: tokens ? fmt(tokens.monthly.total) : '—' },
  ]
  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {stats.map(s => (
        <div
          key={s.label}
          className="flex items-baseline gap-2 rounded-[10px] px-4 py-2.5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <span className="font-mono text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>{s.value}</span>
          <span className="font-mono text-[11px]" style={{ color: 'var(--fg-muted)' }}>{s.label}</span>
        </div>
      ))}
      <div
        className="flex items-center gap-1.5 rounded-[10px] px-4 py-2.5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
      >
        <span className="font-mono text-[11px]" style={{ color: 'var(--fg-muted)' }}>UDD runs only · </span>
        <Link href="/history" className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
          view history →
        </Link>
      </div>
    </div>
  )
}

function SkillCard({ skill, index }: { skill: Skill; index: number }) {
  const accent = ACCENT_CYCLE[index % ACCENT_CYCLE.length]
  return (
    <Link href={`/?skill=${skill.id}`} className="block group cursor-pointer">
      <div
        className="h-full rounded-[14px] flex flex-col gap-3 p-5 transition-all duration-200"
        style={{
          background: accent.glow,
          border: `1px solid ${accent.border}`,
          boxShadow: `0 0 0 0 ${accent.tag}`,
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 20px ${accent.tag}22`)}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{ background: `${accent.tag}20`, color: accent.tag }}
          >
            {skill.category}
          </span>
          <span className="font-mono text-[13px] transition-transform group-hover:translate-x-1" style={{ color: accent.tag }}>→</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-[14px] font-semibold" style={{ color: accent.tag }}>/{skill.id}</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{skill.description}</p>
        </div>
      </div>
    </Link>
  )
}

function DashboardContent() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [tokens, setTokens] = useState<TokenStats | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const searchParams = useSearchParams()
  const activeSkillId = searchParams.get('skill')

  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(setSkills).catch(() => {})
    fetch('/api/tokens').then(r => r.json()).then(setTokens).catch(() => {})
    fetch('/api/user').then(r => r.json()).then(u => {
      setUserName(u.name || null)
      setUserLoaded(true)
    }).catch(() => setUserLoaded(true))
  }, [])

  if (!userLoaded) return null

  if (!userName) {
    return <Onboarding onComplete={name => setUserName(name)} />
  }

  const activeSkill = skills.find(s => s.id === activeSkillId) ?? null
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (activeSkillId) {
    return (
      <div className="p-6 md:p-10 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          {activeSkill?.category && (
            <EyebrowLabel color="var(--accent-primary)">{activeSkill.category}</EyebrowLabel>
          )}
          <h1 className="text-sub-small" style={{ color: 'var(--fg)' }}>/{activeSkillId}</h1>
          {activeSkill?.description && (
            <p className="text-[15px]" style={{ color: 'var(--fg-muted)' }}>{activeSkill.description}</p>
          )}
        </div>
        <SkillRunner skillId={activeSkillId} description={activeSkill?.description} />
      </div>
    )
  }

  // Group skills by category
  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {} as Record<string, Skill[]>)

  let cardIndex = 0

  return (
    <div>
      {/* ── Hero ── */}
      <header className="mx-auto max-w-5xl flex flex-col gap-5 px-6 py-16 md:py-20">
        <EyebrowLabel>Unified Developer Dashboard</EyebrowLabel>

        <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
          {greeting()},{' '}
          <Hi color="var(--accent-primary)">{userName}.</Hi>
        </h1>

        <p className="max-w-2xl text-[17px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
          {today} — your{' '}
          <Hi color="var(--fg)">AI workspace</Hi>.
          {' '}Pick a{' '}
          <Hi color="var(--accent-primary)">skill</Hi>{' '}
          below, browse the{' '}
          <Link href="/history" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}
            className="hover:underline">history</Link>,
          {' '}or open{' '}
          <Link href="/chat" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}
            className="hover:underline">Chat</Link>{' '}
          for a free-form conversation.
        </p>

        {/* Compact token strip */}
        <div className="flex flex-col gap-2 mt-1">
          <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--fg-muted)' }}>
            Token usage — UDD only
          </p>
          <TokenStrip tokens={tokens} />
        </div>
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      {/* ── Skills ── */}
      {skills.length === 0 ? (
        <section className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>Loading skills…</p>
        </section>
      ) : (
        Object.entries(grouped).map(([category, catSkills]) => {
          const section = (
            <section key={category} className="mx-auto max-w-5xl px-6 py-12">
              <div className="mb-6 flex items-baseline gap-3">
                <h2 className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>
                  {category} skills
                </h2>
                <span
                  className="font-mono text-[12px] px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}
                >
                  {catSkills.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catSkills.map(skill => {
                  const el = <SkillCard key={skill.id} skill={skill} index={cardIndex} />
                  cardIndex++
                  return el
                })}
              </div>
            </section>
          )
          return section
        })
      )}

      <div className="h-16" />
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}
