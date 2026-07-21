'use client'
import { useEffect, useState } from 'react'
import SkillRunner from '@/components/SkillRunner'
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
        <EyebrowLabel>Resume Manager</EyebrowLabel>
        <h1 className="text-sub-large">
          Build.{' '}
          <span style={{ color: 'var(--accent-primary)' }}>Scan. Ship.</span>
        </h1>
        <p className="max-w-2xl text-lg" style={{ color: 'var(--fg-body)' }}>
          Tailored resumes that pass the ATS gate at 85% before you ever see them.
          Powered by open-source TF-IDF keyword matching.
        </p>
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <EyebrowLabel>01 / Run skill</EyebrowLabel>
              <hr className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />
            </div>
            <SkillRunner
              skillId="resume-update"
              description="Professional resume coach — build or tailor your resume with ATS validation"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <EyebrowLabel>02 / Saved resumes</EyebrowLabel>
              <hr className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />
            </div>
            {resumes.length === 0 ? (
              <div className="util-card">
                <p className="text-[16px] font-medium" style={{ color: 'var(--fg-body)' }}>No resumes saved yet.</p>
                <p className="text-[14px] mt-2" style={{ color: 'var(--fg-muted)' }}>Run the skill and save output to see them here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {resumes.map(r => <ResumeCard key={r.id} resume={r} />)}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
