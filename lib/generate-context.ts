import fs from 'fs'
import db from './db'
import { UDD_DIR, CONTEXT_FILE, USER_FILE } from './paths'

export function generateUDDContext(): string {
  const sections: string[] = ['# UDD — Live Job Search Context']

  // User profile
  try {
    const user = JSON.parse(fs.readFileSync(USER_FILE, 'utf-8'))
    if (user.name) sections.push(`**Job seeker:** ${user.name}`)
  } catch { /* no profile yet */ }

  // Active applications summary
  try {
    const apps = db.prepare(
      `SELECT company, role, status, location, salary_range, key_skills
       FROM applications ORDER BY updated_at DESC LIMIT 20`
    ).all() as { company: string; role: string; status: string; location: string; salary_range: string; key_skills: string }[]

    if (apps.length > 0) {
      const byStatus: Record<string, string[]> = {}
      for (const a of apps) {
        const tag = a.status ?? 'wishlist'
        if (!byStatus[tag]) byStatus[tag] = []
        byStatus[tag].push(`${a.company} — ${a.role}${a.location ? ` (${a.location})` : ''}${a.salary_range ? ` [${a.salary_range}]` : ''}`)
      }
      const lines = ['## Applications being tracked']
      for (const [status, entries] of Object.entries(byStatus)) {
        lines.push(`\n### ${status}`)
        for (const e of entries) lines.push(`- ${e}`)
      }
      sections.push(lines.join('\n'))
    }
  } catch { /* db not ready */ }

  // User context snippets
  try {
    const snippets = db.prepare(`SELECT label, content FROM context_snippets ORDER BY created_at ASC`).all() as { label: string; content: string }[]
    for (const s of snippets) {
      if (s.content.trim()) sections.push(`[CONTEXT: ${s.label}]\n${s.content.trim()}\n[/CONTEXT]`)
    }
  } catch { /* db not ready */ }

  // Skills in use
  try {
    const skills = db.prepare(
      `SELECT skill, COUNT(*) as n FROM sessions WHERE skill NOT LIKE '__%__' GROUP BY skill ORDER BY n DESC LIMIT 10`
    ).all() as { skill: string; n: number }[]

    if (skills.length > 0) {
      const lines = ['## Skills used (most → least)']
      for (const s of skills) lines.push(`- /${s.skill} (${s.n} runs)`)
      sections.push(lines.join('\n'))
    }
  } catch { /* db not ready */ }

  sections.push(`\n_Generated: ${new Date().toISOString()}_`)
  return sections.join('\n\n')
}

export function writeUDDContext(): string {
  const content = generateUDDContext()
  if (!fs.existsSync(UDD_DIR)) fs.mkdirSync(UDD_DIR, { recursive: true })
  fs.writeFileSync(CONTEXT_FILE, content, 'utf-8')
  return CONTEXT_FILE
}

// Ensure udd-context.md is in the user's contextFiles list
export function ensureContextFileRegistered(): void {
  try {
    const raw = fs.readFileSync(USER_FILE, 'utf-8')
    const user = JSON.parse(raw)
    const files: string[] = user.contextFiles ?? []
    const contextPath = CONTEXT_FILE
    if (!files.includes(contextPath)) {
      user.contextFiles = [contextPath, ...files]
      fs.writeFileSync(USER_FILE, JSON.stringify(user, null, 2), 'utf-8')
    }
  } catch { /* user.json doesn't exist yet, will be created on first save */ }
}
