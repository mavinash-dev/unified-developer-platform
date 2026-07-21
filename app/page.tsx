'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SkillRunner from '@/components/SkillRunner'
import EyebrowLabel from '@/components/EyebrowLabel'
import Onboarding from '@/components/Onboarding'

interface Skill { id: string; description: string; category: string }

function timeGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 22) return 'Good evening'
  return 'Hey'
}

function Hi({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ color }}>{children}</span>
}

// Words that get accent color when they appear in the Claude greeting
const HIGHLIGHT: { pattern: RegExp; color: string }[] = [
  { pattern: /\b(interview(?:ing|s)?)\b/gi,       color: '#f59e0b' },  // amber — in-progress
  { pattern: /\b(offer(?:s)?)\b/gi,               color: '#10b981' },  // green — positive signal
  { pattern: /\b(skill(?:s)?|\/\w[\w-]*)\b/gi,   color: '#a855f7' },  // violet — tools
  { pattern: /\b(drop(?:ped)?|Drop Zone)\b/gi,    color: '#a855f7' },
  { pattern: /\b(resume(?:s)?)\b/gi,              color: '#a855f7' },
  { pattern: /\b(tracker|applied|application(?:s)?)\b/gi, color: '#3d9dff' }, // blue — pipeline
  { pattern: /\b(chat)\b/gi,                      color: '#3d9dff' },
]

function HighlightedGreeting({ text }: { text: string }) {
  // Build a single combined regex that captures all keyword groups
  const combined = new RegExp(
    HIGHLIGHT.map(h => h.pattern.source).join('|'),
    'gi'
  )
  const colorMap = new Map<string, string>()
  HIGHLIGHT.forEach(h => {
    const re = new RegExp(h.pattern.source, 'i')
    // Map each individual pattern to its color for lookup
    colorMap.set(h.pattern.source, h.color)
  })

  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  combined.lastIndex = 0
  while ((match = combined.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))

    // Find which pattern matched to get the right color
    const word = match[0]
    const color = HIGHLIGHT.find(h => new RegExp(h.pattern.source, 'i').test(word))?.color ?? 'inherit'
    parts.push(
      <span key={match.index} style={{ color, fontWeight: 500 }}>{word}</span>
    )
    last = match.index + word.length
  }

  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

function DashboardContent() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [userName, setUserName] = useState<string | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [greeting, setGreeting] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const activeSkillId = searchParams.get('skill')
  const activeSkillArgs = searchParams.get('args') ?? ''

  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(setSkills).catch(() => {})
    fetch('/api/user').then(r => r.json()).then(u => {
      setUserName(u.name || null)
      setUserLoaded(true)
    }).catch(() => setUserLoaded(true))
    fetch('/api/greeting').then(r => r.json()).then(d => setGreeting(d.greeting)).catch(() => {})
  }, [])

  if (!userName && userLoaded) {
    return <Onboarding onComplete={name => setUserName(name)} />
  }

  const activeSkill = skills.find(s => s.id === activeSkillId) ?? null
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (activeSkillId) {
    return (
      <div className="p-6 md:p-10 flex flex-col gap-6" style={{ opacity: userLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <div className="flex flex-col gap-1">
          {activeSkill?.category && (
            <EyebrowLabel color="var(--accent-primary)">{activeSkill.category}</EyebrowLabel>
          )}
          <h1 className="text-sub-small" style={{ color: 'var(--fg)' }}>/{activeSkillId}</h1>
          {activeSkill?.description && (
            <p className="text-[15px]" style={{ color: 'var(--fg-muted)' }}>{activeSkill.description}</p>
          )}
        </div>
        <SkillRunner skillId={activeSkillId} description={activeSkill?.description} defaultArgs={activeSkillArgs} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col justify-center" style={{ opacity: userLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      <header className="mx-auto max-w-2xl flex flex-col gap-6 px-6 py-20 md:py-32">
        <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
          {timeGreeting()},{' '}
          <Hi color="var(--accent-primary)">{userName}.</Hi>
        </h1>

        <p className="font-mono text-[12px] tracking-widest" style={{ color: 'var(--fg-muted)', opacity: 0.5 }}>
          {today}
        </p>

        <p
          className="text-[17px] leading-relaxed"
          style={{ color: 'var(--fg-muted)', opacity: greeting ? 1 : 0, transition: 'opacity 0.6s ease', minHeight: '1.6em' }}
        >
          {greeting && <HighlightedGreeting text={greeting} />}
        </p>
      </header>
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
