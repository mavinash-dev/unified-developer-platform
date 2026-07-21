'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import SkillRunner from '@/components/SkillRunner'
import ResumeCard from '@/components/ResumeCard'
import { Separator } from '@/components/ui/separator'

interface Resume {
  id: number; company: string; role: string; ats_score: number | null
  format: string; compatibility: string | null; created_at: string
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])

  useEffect(() => {
    fetch('/api/resumes').then(r => r.json()).then(setResumes)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">⚡ Unified Dev Dashboard</span>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Dashboard</Link>
          <Link href="/resume" className="text-foreground font-medium">Resumes</Link>
          <Link href="/scout" className="hover:text-foreground">Job Scout</Link>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Resume Manager</h1>
        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-base font-semibold mb-3">Run /resume-update</h2>
            <SkillRunner skill="resume" />
          </div>
          <div>
            <h2 className="text-base font-semibold mb-3">Saved Resumes</h2>
            {resumes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resumes saved yet. Run the skill to create one.</p>
            ) : (
              <div className="space-y-2">
                {resumes.map(r => <ResumeCard key={r.id} resume={r} />)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
