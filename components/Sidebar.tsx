'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

interface Skill { id: string; description: string; category: string }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [tokens, setTokens] = useState<{ daily: { total: number; in: number; out: number } } | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSkill = searchParams.get('skill')

  useEffect(() => {
    const saved = localStorage.getItem('udd-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed(p => {
      localStorage.setItem('udd-sidebar-collapsed', String(!p))
      return !p
    })
  }, [])

  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(setSkills).catch(() => {})
    fetch('/api/tokens').then(r => r.json()).then(setTokens).catch(() => {})
    const id = setInterval(() => {
      fetch('/api/tokens').then(r => r.json()).then(setTokens).catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {} as Record<string, Skill[]>)

  const isSkillActive = (id: string) => pathname === '/' && activeSkill === id
  const isNavActive = (href: string) => pathname === href && !activeSkill

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(p => {
      const n = new Set(p)
      if (n.has(cat)) n.delete(cat); else n.add(cat)
      return n
    })
  }

  if (collapsed) {
    return (
      <aside
        className="flex flex-col items-center py-4 gap-3 shrink-0 border-r"
        style={{
          width: 64,
          background: 'var(--surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <button
          onClick={toggleCollapsed}
          className="w-10 h-10 rounded-[10px] flex items-center justify-center font-mono text-[13px] font-bold transition-colors"
          style={{ color: 'var(--accent-primary)', background: 'rgba(168,85,247,0.1)' }}
          title="Expand sidebar"
        >
          ⚡
        </button>
        <div className="w-6 h-px" style={{ background: 'var(--border-subtle)' }} />
        <Link
          href="/"
          className="w-10 h-10 rounded-[10px] flex items-center justify-center font-mono text-[11px] transition-colors"
          style={{
            background: isNavActive('/') ? 'rgba(168,85,247,0.12)' : 'transparent',
            color: isNavActive('/') ? 'var(--accent-primary)' : 'var(--fg-muted)',
          }}
          title="Dashboard"
        >
          ⊞
        </Link>
        <Link
          href="/resume"
          className="w-10 h-10 rounded-[10px] flex items-center justify-center font-mono text-[11px] transition-colors"
          style={{
            background: pathname === '/resume' ? 'rgba(168,85,247,0.12)' : 'transparent',
            color: pathname === '/resume' ? 'var(--accent-primary)' : 'var(--fg-muted)',
          }}
          title="Resumes"
        >
          ≡
        </Link>
        <div className="w-6 h-px" style={{ background: 'var(--border-subtle)' }} />
        {skills.map(s => (
          <Link
            key={s.id}
            href={`/?skill=${s.id}`}
            className="w-10 h-10 rounded-[10px] flex items-center justify-center font-mono text-[10px] font-medium transition-colors"
            style={{
              background: isSkillActive(s.id) ? 'rgba(168,85,247,0.12)' : 'transparent',
              color: isSkillActive(s.id) ? 'var(--accent-primary)' : 'var(--fg-muted)',
            }}
            title={`/${s.id}`}
          >
            /{s.id.slice(0, 2)}
          </Link>
        ))}
      </aside>
    )
  }

  return (
    <aside
      className="flex flex-col shrink-0 border-r overflow-hidden"
      style={{
        width: 260,
        background: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span className="font-mono text-[13px] font-bold tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>
          ⚡ UDD
        </span>
        <button
          onClick={toggleCollapsed}
          className="w-7 h-7 rounded-[6px] flex items-center justify-center font-mono text-[12px] transition-colors hover:bg-white/5"
          style={{ color: 'var(--fg-muted)' }}
          title="Collapse sidebar"
        >
          ←
        </button>
      </div>

      {/* Nav + Skills — scrollable */}
      <div className="flex-1 overflow-y-auto py-3">
        {/* Static nav */}
        <div className="px-3 pb-3 flex flex-col gap-0.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors"
            style={{
              background: isNavActive('/') ? 'rgba(168,85,247,0.12)' : 'transparent',
              color: isNavActive('/') ? 'var(--accent-primary)' : 'var(--fg-body)',
            }}
          >
            <span className="font-mono text-[11px] opacity-60">⊞</span>
            Dashboard
          </Link>
          <Link
            href="/resume"
            className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors"
            style={{
              background: pathname === '/resume' ? 'rgba(168,85,247,0.12)' : 'transparent',
              color: pathname === '/resume' ? 'var(--accent-primary)' : 'var(--fg-body)',
            }}
          >
            <span className="font-mono text-[11px] opacity-60">≡</span>
            Resumes
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors"
            style={{
              background: pathname === '/chat' ? 'rgba(168,85,247,0.12)' : 'transparent',
              color: pathname === '/chat' ? 'var(--accent-primary)' : 'var(--fg-body)',
            }}
          >
            <span className="font-mono text-[11px] opacity-60">◎</span>
            Chat
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors"
            style={{
              background: pathname === '/history' ? 'rgba(168,85,247,0.12)' : 'transparent',
              color: pathname === '/history' ? 'var(--accent-primary)' : 'var(--fg-body)',
            }}
          >
            <span className="font-mono text-[11px] opacity-60">⊙</span>
            History
          </Link>
        </div>

        <div className="mx-3 mb-3 h-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Skill categories */}
        {Object.entries(grouped).map(([cat, catSkills]) => {
          const isCatCollapsed = collapsedCategories.has(cat)
          return (
            <div key={cat} className="px-3 mb-2">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-1 py-1.5 mb-1"
              >
                <span className="font-mono text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--fg-muted)' }}>
                  {cat}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--fg-muted)' }}>
                  {isCatCollapsed ? '▸' : '▾'}
                </span>
              </button>

              {!isCatCollapsed && (
                <div className="flex flex-col gap-0.5">
                  {catSkills.map(s => (
                    <Link
                      key={s.id}
                      href={`/?skill=${s.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13px] transition-colors group"
                      style={{
                        background: isSkillActive(s.id) ? 'rgba(168,85,247,0.12)' : 'transparent',
                        color: isSkillActive(s.id) ? 'var(--accent-primary)' : 'var(--fg-body)',
                      }}
                    >
                      <span
                        className="font-mono text-[11px] shrink-0 transition-colors"
                        style={{ color: isSkillActive(s.id) ? 'var(--accent-primary)' : 'var(--fg-muted)' }}
                      >
                        /
                      </span>
                      <span className="truncate">{s.id}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {skills.length === 0 && (
          <p className="px-4 text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            Loading skills…
          </p>
        )}
      </div>

      {/* Token bar at bottom */}
      {tokens && (
        <div className="border-t px-4 py-3 shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--fg-muted)' }}>
              Today
            </span>
            <span className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
              {fmt(tokens.daily.total)} tokens
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
