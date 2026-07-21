'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import TokenMeter from '@/components/TokenMeter'
import SkillRunner from '@/components/SkillRunner'
import EyebrowLabel from '@/components/EyebrowLabel'

interface Skill { id: string; description: string; category: string }

function DashboardContent() {
  const [skills, setSkills] = useState<Skill[]>([])
  const searchParams = useSearchParams()
  const activeSkillId = searchParams.get('skill')

  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(setSkills).catch(() => {})
  }, [])

  const activeSkill = skills.find(s => s.id === activeSkillId) ?? null

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (activeSkill) {
    return (
      <div className="p-6 md:p-10 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <EyebrowLabel color="var(--accent-primary)">{activeSkill.category}</EyebrowLabel>
          <h1 className="text-sub-small" style={{ color: 'var(--fg)' }}>/{activeSkill.id}</h1>
          {activeSkill.description && (
            <p className="text-[15px]" style={{ color: 'var(--fg-muted)' }}>{activeSkill.description}</p>
          )}
        </div>
        <SkillRunner skillId={activeSkill.id} description={activeSkill.description} />
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <header className="mx-auto max-w-5xl flex flex-col gap-4 px-6 py-16 md:py-20">
        <EyebrowLabel>Unified Developer Dashboard</EyebrowLabel>
        <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
          Good morning,{' '}
          <span style={{ color: 'var(--accent-primary)' }}>Avinash.</span>
        </h1>
        <p className="max-w-2xl text-lg" style={{ color: 'var(--fg-body)' }}>
          {today} — your career intelligence platform.
          Build resumes, scan for ATS fit, and scout better roles.
        </p>
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      {/* Token meter + quick-launch */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-8 flex flex-col gap-2">
          <EyebrowLabel>01 / Overview</EyebrowLabel>
          <h2 className="text-sub-small" style={{ color: 'var(--fg)' }}>What&apos;s running.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <TokenMeter />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/?skill=resume-update" className="block">
              <div className="slab-violet h-full">
                <article className="slab-inner h-full hover:bg-[#fffefa] transition-colors">
                  <div className="flex flex-col gap-2">
                    <p className="font-mono text-[12px] font-medium leading-none" style={{ color: '#080f11' }}>01 / RESUME</p>
                    <div aria-hidden className="h-px w-full" style={{ background: '#080f11', opacity: 0.15 }} />
                  </div>
                  <div>
                    <p className="text-card-title" style={{ color: '#080f11' }}>Resume manager</p>
                    <p className="text-[14px] font-medium mt-3" style={{ color: '#1a242a' }}>
                      Build, ATS-scan, and save tailored resumes. Gate at 85% before delivery.
                    </p>
                  </div>
                  <span className="text-[14px] font-semibold" style={{ color: '#a855f7' }}>Open →</span>
                </article>
              </div>
            </Link>

            <Link href="/?skill=job-scout" className="block">
              <div className="slab-blue h-full">
                <article className="slab-inner h-full hover:bg-[#fffefa] transition-colors">
                  <div className="flex flex-col gap-2">
                    <p className="font-mono text-[12px] font-medium leading-none" style={{ color: '#080f11' }}>02 / SCOUT</p>
                    <div aria-hidden className="h-px w-full" style={{ background: '#080f11', opacity: 0.15 }} />
                  </div>
                  <div>
                    <p className="text-card-title" style={{ color: '#080f11' }}>Job scout</p>
                    <p className="text-[14px] font-medium mt-3" style={{ color: '#1a242a' }}>
                      Find equivalent roles at same or higher TC. Live benchmarks from levels.fyi.
                    </p>
                  </div>
                  <span className="text-[14px] font-semibold" style={{ color: '#3d9dff' }}>Open →</span>
                </article>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      {/* Skill count hint */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
          {skills.length} skill{skills.length !== 1 ? 's' : ''} available — select one from the sidebar to launch.
          New <span className="font-mono text-[13px]">~/.claude/commands/*.md</span> files appear automatically.
        </p>
      </section>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-10 font-mono text-[13px]" style={{ color: 'var(--fg-muted)' }}>Loading…</div>}>
      <DashboardContent />
    </Suspense>
  )
}
