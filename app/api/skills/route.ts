import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'commands')

function parseFrontmatter(raw: string): { description: string; category: string } {
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)/)
  if (fm) {
    const header = fm[1]
    const body = fm[2]
    const descMatch = header.match(/^description:\s*(.+)$/m)
    const catMatch = header.match(/^category:\s*(.+)$/m)
    const description = descMatch
      ? descMatch[1].replace(/^['"]|['"]$/g, '').trim()
      : body.split('\n').find(l => l.trim() && !l.startsWith('#') && l.length > 10)?.replace(/^You are /, '').slice(0, 100) ?? ''
    const category = catMatch ? catMatch[1].trim() : 'General'
    return { description, category }
  }
  const firstLine = raw.split('\n').find(l => l.trim() && !l.startsWith('#') && !l.startsWith('---') && l.length > 10) ?? ''
  return {
    description: firstLine.replace(/^You are /, '').slice(0, 100),
    category: 'General',
  }
}

export function GET() {
  try {
    const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.md'))
    const skills = files.map(file => {
      const name = file.replace('.md', '')
      const raw = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf-8')
      const { description, category } = parseFrontmatter(raw)
      return { id: name, file, description, category }
    })
    return NextResponse.json(skills)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
