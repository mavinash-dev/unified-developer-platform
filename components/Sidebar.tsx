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

  // Hide sidebar only when phone scans the QR (?mobile=1)
  if (pathname === '/drop' && searchParams.get('mobile') === '1') return null

  if (collapsed) {
    return (
      <aside
        className="flex flex-col items-center py-4 gap-2 shrink-0 border-r"
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
        <div className="w-6 h-px my-1" style={{ background: 'var(--border-subtle)' }} />
        <Link
          href="/"
          className="w-10 h-10 rounded-[10px] flex items-center justify-center font-mono text-[13px] transition-colors"
          style={{
            background: isNavActive('/') ? 'rgba(168,85,247,0.15)' : 'transparent',
            color: isNavActive('/') ? 'var(--accent-primary)' : 'var(--fg-muted)',
          }}
          title="Dashboard"
        >
          ⊞
        </Link>
        <div className="w-6 h-px my-1" style={{ background: 'var(--border-subtle)' }} />
        {skills.map(s => (
          <Link
            key={s.id}
            href={`/?skill=${s.id}`}
            className="w-10 h-10 rounded-[10px] flex items-center justify-center font-mono text-[10px] font-semibold transition-colors"
            style={{
              background: isSkillActive(s.id) ? 'rgba(168,85,247,0.15)' : 'transparent',
              color: isSkillActive(s.id) ? 'var(--accent-primary)' : '#6a7173',
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
        <div className="flex items-center gap-2">
          <span className="font-mono text-[14px] font-bold" style={{ color: 'var(--accent-primary)' }}>⚡</span>
          <span className="font-mono text-[13px] font-bold tracking-widest uppercase" style={{ color: 'var(--fg)' }}>UDD</span>
        </div>
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
        {/* Section label */}
        <p className="px-4 mb-1.5 font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--fg-muted)', opacity: 0.6 }}>
          Navigate
        </p>

        {/* Static nav */}
        <div className="px-3 pb-3 flex flex-col gap-0.5">
          {[
            { href: '/', icon: '⊞', label: 'Dashboard', active: isNavActive('/') },
            { href: '/chat', icon: '◎', label: 'Chat', active: pathname === '/chat' && !activeSkill },
            { href: '/tracker', icon: '◈', label: 'Tracker', active: pathname === '/tracker' },
            { href: '/drop', icon: '⬇', label: 'Drop Zone', active: pathname === '/drop' && !searchParams.get('mobile') },
            { href: '/history', icon: '⊙', label: 'History', active: pathname === '/history' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer hover:bg-white/5"
              style={{
                background: item.active ? 'rgba(168,85,247,0.12)' : 'transparent',
                color: item.active ? 'var(--accent-primary)' : 'var(--fg-muted)',
                fontWeight: item.active ? 600 : 500,
              }}
            >
              <span
                className="font-mono text-[12px] w-4 text-center shrink-0"
                style={{ color: item.active ? 'var(--accent-primary)' : '#6a7173' }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}

          {/* Resumes with sub-item */}
          <Link
            href="/resume"
            className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer hover:bg-white/5"
            style={{
              background: pathname === '/resume' ? 'rgba(168,85,247,0.12)' : 'transparent',
              color: pathname === '/resume' ? 'var(--accent-primary)' : 'var(--fg-muted)',
              fontWeight: pathname === '/resume' ? 600 : 500,
            }}
          >
            <span
              className="font-mono text-[12px] w-4 text-center shrink-0"
              style={{ color: pathname === '/resume' ? 'var(--accent-primary)' : '#6a7173' }}
            >
              ▤
            </span>
            Resumes
          </Link>
          <Link
            href="/resume/templates"
            className="flex items-center gap-1.5 pl-9 pr-3 py-1.5 rounded-[8px] text-[12px] transition-colors cursor-pointer hover:bg-white/5"
            style={{
              background: pathname === '/resume/templates' ? 'rgba(168,85,247,0.08)' : 'transparent',
              color: pathname === '/resume/templates' ? 'var(--accent-primary)' : '#6a7173',
            }}
          >
            <span className="font-mono text-[10px]" style={{ color: '#6a7173' }}>↳</span>
            <span>Templates</span>
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer hover:bg-white/5"
            style={{
              background: pathname === '/profile' ? 'rgba(168,85,247,0.12)' : 'transparent',
              color: pathname === '/profile' ? 'var(--accent-primary)' : 'var(--fg-muted)',
              fontWeight: pathname === '/profile' ? 600 : 500,
            }}
          >
            <span
              className="font-mono text-[12px] w-4 text-center shrink-0"
              style={{ color: pathname === '/profile' ? 'var(--accent-primary)' : '#6a7173' }}
            >
              ◉
            </span>
            Profile
          </Link>
          <Link
            href="/tips"
            className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer hover:bg-white/5"
            style={{
              background: pathname === '/tips' ? 'rgba(168,85,247,0.12)' : 'transparent',
              color: pathname === '/tips' ? 'var(--accent-primary)' : 'var(--fg-muted)',
              fontWeight: pathname === '/tips' ? 600 : 500,
            }}
          >
            <span
              className="font-mono text-[12px] w-4 text-center shrink-0"
              style={{ color: pathname === '/tips' ? 'var(--accent-primary)' : '#6a7173' }}
            >
              ?
            </span>
            Tips
          </Link>
        </div>

        <div className="mx-3 mb-2 h-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Skills section label */}
        <p className="px-4 mb-1.5 font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--fg-muted)', opacity: 0.6 }}>
          Skills
        </p>

        {/* Skill categories */}
        {Object.entries(grouped).map(([cat, catSkills]) => {
          const isCatCollapsed = collapsedCategories.has(cat)
          return (
            <div key={cat} className="px-3 mb-1">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-2 py-1 mb-0.5 cursor-pointer rounded-[6px] hover:bg-white/5"
              >
                <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#6a7173' }}>
                  {cat}
                </span>
                <span className="font-mono text-[9px]" style={{ color: '#6a7173' }}>
                  {isCatCollapsed ? '▸' : '▾'}
                </span>
              </button>

              {!isCatCollapsed && (
                <div className="flex flex-col gap-0.5">
                  {catSkills.map(s => (
                    <Link
                      key={s.id}
                      href={`/?skill=${s.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] transition-colors group cursor-pointer hover:bg-white/5"
                      style={{
                        background: isSkillActive(s.id) ? 'rgba(168,85,247,0.12)' : 'transparent',
                      }}
                    >
                      <span
                        className="font-mono text-[12px] shrink-0 font-semibold"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        /
                      </span>
                      <span
                        className="font-mono text-[12px] truncate"
                        style={{
                          color: isSkillActive(s.id) ? 'var(--accent-primary)' : 'var(--fg-body)',
                          fontWeight: isSkillActive(s.id) ? 600 : 400,
                        }}
                      >
                        {s.id}
                      </span>
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
        <div className="border-t px-4 py-3 shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--elevated)' }}>
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#6a7173' }}>
              Tokens today
            </span>
            <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--accent-primary)' }}>
              {fmt(tokens.daily.total)}
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
