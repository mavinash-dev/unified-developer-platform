'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import TokenMeter from '@/components/TokenMeter'
import SkillRunner from '@/components/SkillRunner'
import EyebrowLabel from '@/components/EyebrowLabel'
import Onboarding from '@/components/Onboarding'

interface Skill { id: string; description: string; category: string }

function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 22) return 'Good evening'
  return 'Hey'
}

const ACCENT_CYCLE = [
  { border: 'rgba(168,85,247,0.4)', label: 'var(--accent-primary)', tag: '#a855f7' },
  { border: 'rgba(61,157,255,0.4)', label: 'var(--accent-blue)', tag: '#3d9dff' },
  { border: 'rgba(16,185,129,0.4)', label: '#10b981', tag: '#10b981' },
  { border: 'rgba(245,158,11,0.4)', label: 'var(--accent-yellow)', tag: '#f59e0b' },
]

function SkillCard({ skill, index }: { skill: Skill; index: number }) {
  const accent = ACCENT_CYCLE[index % ACCENT_CYCLE.length]
  return (
    <Link href={`/?skill=${skill.id}`} className="block group">
      <div
        className="h-full rounded-[14px] p-px transition-all duration-200"
        style={{ background: accent.border }}
      >
        <div
          className="h-full rounded-[13px] p-5 flex flex-col gap-3 transition-colors"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{ background: `${accent.tag}18`, color: accent.tag }}
            >
              {skill.category}
            </span>
            <span className="font-mono text-[11px] transition-transform group-hover:translate-x-0.5" style={{ color: accent.tag }}>→</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>/{skill.id}</p>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{skill.description}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

function DashboardContent() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [userName, setUserName] = useState<string | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const searchParams = useSearchParams()
  const activeSkillId = searchParams.get('skill')

  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(setSkills).catch(() => {})
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

  // Group skills by category for section headers
  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {} as Record<string, Skill[]>)

  let cardIndex = 0

  return (
    <div>
      {/* Hero */}
      <header className="mx-auto max-w-5xl flex flex-col gap-4 px-6 py-16 md:py-20">
        <EyebrowLabel>Unified Developer Dashboard</EyebrowLabel>
        <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
          {greeting()},{' '}
          <span style={{ color: 'var(--accent-primary)' }}>{userName}.</span>
        </h1>
        <p className="max-w-2xl text-lg" style={{ color: 'var(--fg-body)' }}>
          {today} — your AI workspace. Pick a skill below or use the sidebar.
        </p>
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      {/* Token overview */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-2">
          <EyebrowLabel>Overview</EyebrowLabel>
          <h2 className="text-sub-small" style={{ color: 'var(--fg)' }}>Usage today.</h2>
        </div>
        <div className="max-w-sm">
          <TokenMeter />
        </div>
      </section>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      {/* Skills — grouped by category */}
      {skills.length === 0 ? (
        <section className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
            Loading skills…
          </p>
        </section>
      ) : (
        Object.entries(grouped).map(([category, catSkills]) => {
          const section = (
            <section key={category} className="mx-auto max-w-5xl px-6 py-10">
              <div className="mb-6 flex flex-col gap-2">
                <EyebrowLabel>{category}</EyebrowLabel>
                <h2 className="text-sub-small" style={{ color: 'var(--fg)' }}>Skills.</h2>
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

      <div className="h-10" />
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
