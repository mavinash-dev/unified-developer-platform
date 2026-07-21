import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

const HOME = os.homedir()

export const CONTEXT_CATEGORIES = [
  {
    id: 'resume',
    label: 'Resume',
    hint: 'Work history, skills, and achievements',
    guide: '~/resume.md',
    patterns: ['resume.md', 'Resume.md', 'resume.pdf', 'Resume.pdf', 'cv.md', 'CV.md', 'cv.pdf', 'CV.pdf'],
    searchDirs: [HOME, path.join(HOME, 'Documents'), path.join(HOME, 'Downloads'), path.join(HOME, 'Desktop')],
  },
  {
    id: 'bio',
    label: 'About Me',
    hint: 'Who you are and what you\'re looking for',
    guide: '~/bio.md',
    patterns: ['bio.md', 'Bio.md', 'about.md', 'About.md', 'about-me.md'],
    searchDirs: [HOME, path.join(HOME, 'Documents')],
  },
  {
    id: 'facts',
    label: 'Facts',
    hint: 'Quick facts Claude should always know about you',
    guide: '~/facts.md',
    patterns: ['facts.md', 'Facts.md'],
    searchDirs: [HOME, path.join(HOME, 'Documents')],
  },
  {
    id: 'tech-stack',
    label: 'Tech Stack',
    hint: 'Languages, frameworks, and tools you use daily',
    guide: '~/tech-stack.md',
    patterns: ['tech-stack.md', 'stack.md', 'skills.md', 'Tech-Stack.md'],
    searchDirs: [HOME, path.join(HOME, 'Documents')],
  },
  {
    id: 'company',
    label: 'Company Context',
    hint: 'Your team, product, and role there',
    guide: '~/company-context.md',
    patterns: ['company-context.md', 'company.md', 'company.txt'],
    searchDirs: [HOME, path.join(HOME, 'Documents')],
  },
]

export interface ContextCategory {
  id: string
  label: string
  hint: string
  guide: string
  found: string[]  // display paths like ~/resume.md
}

export function GET() {
  const results: ContextCategory[] = CONTEXT_CATEGORIES.map(cat => {
    const found: string[] = []
    for (const dir of cat.searchDirs) {
      for (const pat of cat.patterns) {
        const full = path.join(dir, pat)
        if (fs.existsSync(full)) {
          const display = full.startsWith(HOME) ? `~${full.slice(HOME.length)}` : full
          if (!found.includes(display)) found.push(display)
        }
      }
    }
    return { id: cat.id, label: cat.label, hint: cat.hint, guide: cat.guide, found }
  })
  return NextResponse.json(results)
}
