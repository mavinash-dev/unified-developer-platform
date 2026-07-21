import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

type Params = Promise<{ id: string }>

function getApp(slug: string) {
  return db.prepare(`SELECT * FROM applications WHERE slug = ?`).get(slug) as ({ id: number; key_skills: string } & Record<string, unknown>) | undefined
}

export function GET(_req: NextRequest, context: { params: Params }) {
  return context.params.then(({ id: slug }) => {
    const app = getApp(slug)
    if (!app) return NextResponse.json(null, { status: 404 })
    const contacts = db.prepare(`SELECT * FROM contacts WHERE application_id = ? ORDER BY created_at ASC`).all(app.id)
    return NextResponse.json({ ...app, key_skills: JSON.parse(app.key_skills || '[]'), contacts })
  })
}

export async function PATCH(req: NextRequest, context: { params: Params }) {
  const { id: slug } = await context.params
  const app = getApp(slug)
  if (!app) return NextResponse.json(null, { status: 404 })
  const body = await req.json()

  const allowed = ['company', 'role', 'url', 'status', 'location', 'remote', 'salary_range', 'jd_summary', 'key_skills', 'notes']
  const fields: string[] = []
  const values: unknown[] = []

  for (const key of allowed) {
    if (key in body) {
      fields.push(`${key} = ?`)
      values.push(key === 'key_skills' ? JSON.stringify(body[key]) : key === 'remote' ? (body[key] ? 1 : 0) : body[key])
    }
  }

  if (!fields.length) return NextResponse.json({ error: 'no fields to update' }, { status: 400 })

  fields.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(app.id)
  db.prepare(`UPDATE applications SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  const updated = db.prepare(`SELECT * FROM applications WHERE id = ?`).get(app.id) as ({ key_skills: string } & Record<string, unknown>)
  const contacts = db.prepare(`SELECT * FROM contacts WHERE application_id = ? ORDER BY created_at ASC`).all(app.id)
  return NextResponse.json({ ...updated, key_skills: JSON.parse(updated.key_skills || '[]'), contacts })
}

export function DELETE(_req: NextRequest, context: { params: Params }) {
  return context.params.then(({ id: slug }) => {
    db.prepare(`DELETE FROM applications WHERE slug = ?`).run(slug)
    return NextResponse.json({ ok: true })
  })
}

export async function POST(req: NextRequest, context: { params: Params }) {
  const { id: slug } = await context.params
  const app = getApp(slug)
  if (!app) return NextResponse.json(null, { status: 404 })
  const body = await req.json()

  if (body._action === 'add_contact') {
    const { name, title = '', company = '', linkedin_url = '', email = '', phone = '', relationship = 'referral', notes = '' } = body
    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const result = db.prepare(`
      INSERT INTO contacts (application_id, name, title, company, linkedin_url, email, phone, relationship, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(app.id, name.trim(), title, company || app?.company || '', linkedin_url, email, phone, relationship, notes)
    return NextResponse.json(db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(result.lastInsertRowid), { status: 201 })
  }

  if (body._action === 'delete_contact') {
    db.prepare(`DELETE FROM contacts WHERE id = ? AND application_id = ?`).run(body.contact_id, app.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
