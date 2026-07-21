import { NextResponse } from 'next/server'
import { runClaude } from '@/lib/claude-cli'
import db from '@/lib/db'
import fs from 'fs'
import { USER_FILE } from '@/lib/paths'

interface AppRow { status: string; company: string; role: string }
interface SessionRow { skill: string; n: number }

function getStats() {
  let name = ''
  try {
    const user = JSON.parse(fs.readFileSync(USER_FILE, 'utf-8'))
    name = user.name ?? ''
  } catch { /* no profile */ }

  let apps: AppRow[] = []
  let sessions: SessionRow[] = []
  let totalSessions = 0

  try {
    apps = db.prepare(
      `SELECT status, company, role FROM applications ORDER BY updated_at DESC LIMIT 20`
    ).all() as AppRow[]

    sessions = db.prepare(
      `SELECT skill, COUNT(*) as n FROM sessions WHERE skill NOT LIKE '__%__'
       GROUP BY skill ORDER BY n DESC LIMIT 5`
    ).all() as SessionRow[]

    const row = db.prepare(`SELECT COUNT(*) as n FROM sessions`).get() as { n: number }
    totalSessions = row.n
  } catch { /* db not ready */ }

  return { name, apps, sessions, totalSessions }
}

export async function GET() {
  const { name, apps, sessions, totalSessions } = getStats()

  const isNew = apps.length === 0 && totalSessions === 0

  if (isNew) {
    // No Claude call needed for new users — just a static welcome
    return NextResponse.json({
      greeting: "Your workspace is ready. Drop a job posting to get started, or pick a skill from the sidebar.",
      generated: false,
    })
  }

  // Build a compact context summary for Claude
  const byStatus: Record<string, string[]> = {}
  for (const a of apps) {
    if (!byStatus[a.status]) byStatus[a.status] = []
    byStatus[a.status].push(`${a.company} (${a.role})`)
  }

  const statusLines = Object.entries(byStatus)
    .map(([s, list]) => `${s}: ${list.slice(0, 3).join(', ')}${list.length > 3 ? ` +${list.length - 3} more` : ''}`)
    .join('\n')

  const skillLines = sessions.map(s => `/${s.skill} (${s.n}x)`).join(', ')

  const prompt = `You are writing a 1–2 sentence contextual subtitle for a personal job search dashboard. It appears directly under the greeting "Good [time], ${name || 'there'}." on the home screen.

Current job search context:
${statusLines || 'No applications yet'}
${skillLines ? `\nSkills used: ${skillLines}` : ''}
Total skill runs: ${totalSessions}

Rules:
- 1 sentence max, occasionally 2 if there's a real insight to add
- Be specific — reference actual companies, statuses, or numbers from the context
- Warm and direct, not corporate, not cheerful-bot
- Do NOT start with "You have" or repeat the greeting
- Do NOT add quotes, markdown, or any formatting
- Do NOT mention "dashboard" or "workspace"
- Output only the subtitle text, nothing else`

  try {
    const result = await runClaude(prompt, '__greeting__')
    const text = result.text.trim().replace(/^["']|["']$/g, '')
    return NextResponse.json({ greeting: text, generated: true })
  } catch {
    // Fallback if Claude is unavailable
    const interviewing = byStatus['interviewing']?.length ?? 0
    const offers = byStatus['offer']?.length ?? 0
    const fallback = offers > 0
      ? `${offers} offer${offers > 1 ? 's' : ''} in play — good place to be.`
      : interviewing > 0
      ? `${interviewing} interview${interviewing > 1 ? 's' : ''} in flight.`
      : `${apps.length} application${apps.length > 1 ? 's' : ''} tracked.`
    return NextResponse.json({ greeting: fallback, generated: false })
  }
}
