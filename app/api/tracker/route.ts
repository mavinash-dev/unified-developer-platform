import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import db from '@/lib/db'

function newSlug() { return randomBytes(6).toString('hex') }

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const apps = status && status !== 'all'
    ? db.prepare(`SELECT * FROM applications WHERE status = ? ORDER BY updated_at DESC`).all(status)
    : db.prepare(`SELECT * FROM applications ORDER BY updated_at DESC`).all()

  const ids = (apps as { id: number }[]).map(a => a.id)
  const contacts = ids.length
    ? db.prepare(`SELECT * FROM contacts WHERE application_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at ASC`).all(...ids)
    : []

  const contactsByApp = (contacts as { application_id: number }[]).reduce((acc, c) => {
    if (!acc[c.application_id]) acc[c.application_id] = []
    acc[c.application_id].push(c)
    return acc
  }, {} as Record<number, unknown[]>)

  const result = (apps as { id: number; key_skills: string }[]).map(a => ({
    ...a,
    key_skills: JSON.parse(a.key_skills || '[]'),
    contacts: contactsByApp[a.id] || [],
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { company, role, url = '', status = 'wishlist', location = '', remote = false,
    salary_range = '', jd_summary = '', key_skills = [], notes = '', contacts = [],
    source = 'manual', force = false } = body

  if (!company?.trim() || !role?.trim()) {
    return NextResponse.json({ error: 'company and role are required' }, { status: 400 })
  }

  // Dedup check — same company + role already exists
  if (!force) {
    const existing = db.prepare(
      `SELECT id, company, role, status, source FROM applications WHERE lower(company) = lower(?) AND lower(role) = lower(?)`
    ).all(company.trim(), role.trim()) as { id: number; company: string; role: string; status: string; source: string }[]

    if (existing.length > 0) {
      return NextResponse.json({ duplicate: true, existing }, { status: 409 })
    }
  }

  const slug = newSlug()
  const result = db.prepare(`
    INSERT INTO applications (slug, company, role, url, status, location, remote, salary_range, jd_summary, key_skills, notes, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(slug, company.trim(), role.trim(), url, status, location, remote ? 1 : 0,
    salary_range, jd_summary, JSON.stringify(key_skills), notes, source)

  const appId = result.lastInsertRowid

  for (const c of contacts as { name: string; title?: string; company?: string; linkedin_url?: string; relationship?: string; notes?: string }[]) {
    if (!c.name?.trim()) continue
    db.prepare(`
      INSERT INTO contacts (application_id, name, title, company, linkedin_url, relationship, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(appId, c.name.trim(), c.title || '', c.company || company, c.linkedin_url || '', c.relationship || 'referral', c.notes || '')
  }

  const app = db.prepare(`SELECT * FROM applications WHERE id = ?`).get(appId) as { key_skills: string } & Record<string, unknown>
  const appContacts = db.prepare(`SELECT * FROM contacts WHERE application_id = ?`).all(appId)

  return NextResponse.json({ ...app, key_skills: JSON.parse(app.key_skills || '[]'), contacts: appContacts }, { status: 201 })
}
