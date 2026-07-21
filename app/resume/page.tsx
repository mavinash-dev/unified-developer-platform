'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ResumeCard from '@/components/ResumeCard'
import EyebrowLabel from '@/components/EyebrowLabel'

interface Resume {
  id: number; company: string; role: string; ats_score: number | null
  format: string; compatibility: string | null; created_at: string
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  useEffect(() => { fetch('/api/resumes').then(r => r.json()).then(setResumes) }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      <header className="mx-auto max-w-5xl flex flex-col gap-4 px-6 py-16 md:py-20">
        <EyebrowLabel>Saved Resumes</EyebrowLabel>
        <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
          Your resumes.
        </h1>
        <p className="max-w-2xl text-lg" style={{ color: 'var(--fg-body)' }}>
          Resumes saved from the{' '}
          <Link href="/?skill=resume-update" className="underline" style={{ color: 'var(--accent-primary)' }}>
            /resume-update
          </Link>{' '}
          skill.
        </p>
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      <section className="mx-auto max-w-5xl px-6 py-14">
        {resumes.length === 0 ? (
          <div className="util-card max-w-md">
            <p className="text-[16px] font-medium" style={{ color: 'var(--fg-body)' }}>No resumes saved yet.</p>
            <p className="text-[14px] mt-2" style={{ color: 'var(--fg-muted)' }}>
              Run the{' '}
              <Link href="/?skill=resume-update" style={{ color: 'var(--accent-primary)' }}>
                /resume-update
              </Link>{' '}
              skill and save the output to see it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map(r => <ResumeCard key={r.id} resume={r} />)}
          </div>
        )}
      </section>
    </div>
  )
}
