import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

type Params = Promise<{ id: string }>

export function GET(_req: NextRequest, context: { params: Params }) {
  return context.params.then(({ id }) => {
    const app = db.prepare(`SELECT * FROM applications WHERE id = ?`).get(id) as ({ key_skills: string } & Record<string, unknown>) | undefined
    if (!app) return NextResponse.json(null, { status: 404 })
    const contacts = db.prepare(`SELECT * FROM contacts WHERE application_id = ? ORDER BY created_at ASC`).all(id)
    return NextResponse.json({ ...app, key_skills: JSON.parse(app.key_skills || '[]'), contacts })
  })
}

export async function PATCH(req: NextRequest, context: { params: Params }) {
  const { id } = await context.params
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
  values.push(id)
  db.prepare(`UPDATE applications SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  const app = db.prepare(`SELECT * FROM applications WHERE id = ?`).get(id) as ({ key_skills: string } & Record<string, unknown>)
  const contacts = db.prepare(`SELECT * FROM contacts WHERE application_id = ? ORDER BY created_at ASC`).all(id)
  return NextResponse.json({ ...app, key_skills: JSON.parse(app.key_skills || '[]'), contacts })
}

export function DELETE(_req: NextRequest, context: { params: Params }) {
  return context.params.then(({ id }) => {
    db.prepare(`DELETE FROM applications WHERE id = ?`).run(id)
    return NextResponse.json({ ok: true })
  })
}

export async function POST(req: NextRequest, context: { params: Params }) {
  const { id } = await context.params
  const body = await req.json()

  if (body._action === 'add_contact') {
    const { name, title = '', company = '', linkedin_url = '', relationship = 'referral', notes = '' } = body
    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const app = db.prepare(`SELECT company FROM applications WHERE id = ?`).get(id) as { company: string } | undefined
    const result = db.prepare(`
      INSERT INTO contacts (application_id, name, title, company, linkedin_url, relationship, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), title, company || app?.company || '', linkedin_url, relationship, notes)
    return NextResponse.json(db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(result.lastInsertRowid), { status: 201 })
  }

  if (body._action === 'delete_contact') {
    db.prepare(`DELETE FROM contacts WHERE id = ? AND application_id = ?`).run(body.contact_id, id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
