'use client'
import Link from 'next/link'
import SkillRunner from '@/components/SkillRunner'
import { Separator } from '@/components/ui/separator'

export default function ScoutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">⚡ Unified Dev Dashboard</span>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Dashboard</Link>
          <Link href="/resume" className="hover:text-foreground">Resumes</Link>
          <Link href="/scout" className="text-foreground font-medium">Job Scout</Link>
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Job Scout</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find equivalent or better roles with live TC benchmarks from levels.fyi
          </p>
        </div>
        <Separator />
        <SkillRunner skill="scout" />
      </main>
    </div>
  )
}
