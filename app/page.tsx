import TokenMeter from '@/components/TokenMeter'
import SkillRunner from '@/components/SkillRunner'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">⚡ Unified Dev Dashboard</span>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/" className="text-foreground font-medium">Dashboard</Link>
          <Link href="/resume" className="hover:text-foreground transition-colors">Resumes</Link>
          <Link href="/scout" className="hover:text-foreground transition-colors">Job Scout</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Good morning, Avinash</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <TokenMeter />
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <Link href="/resume">
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <p className="text-2xl mb-1">📄</p>
                  <p className="font-semibold text-sm">Resume Manager</p>
                  <p className="text-xs text-muted-foreground mt-1">Create, ATS-scan, and save tailored resumes</p>
                </div>
                <p className="text-xs text-primary mt-3 font-medium">Open →</p>
              </div>
            </Link>
            <Link href="/scout">
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <p className="text-2xl mb-1">🔍</p>
                  <p className="font-semibold text-sm">Job Scout</p>
                  <p className="text-xs text-muted-foreground mt-1">Find equivalent roles with levels.fyi TC benchmarks</p>
                </div>
                <p className="text-xs text-primary mt-3 font-medium">Open →</p>
              </div>
            </Link>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-base font-semibold mb-4">Quick Launch Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkillRunner skill="resume" />
            <SkillRunner skill="scout" />
          </div>
        </div>
      </main>
    </div>
  )
}
