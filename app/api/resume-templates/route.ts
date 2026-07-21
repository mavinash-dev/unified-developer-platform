import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

interface Template {
  id: number; name: string; category: string; description: string
  guidelines: string; is_builtin: number; created_at: string
}

export function GET() {
  const templates = db.prepare(
    `SELECT id, name, category, description, guidelines, is_builtin, created_at
     FROM resume_templates ORDER BY is_builtin DESC, name ASC`
  ).all() as Template[]
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const { name, category = 'General', description = '', guidelines } = await req.json()
  if (!name || !guidelines) {
    return NextResponse.json({ error: 'name and guidelines are required' }, { status: 400 })
  }
  const result = db.prepare(
    `INSERT INTO resume_templates (name, category, description, guidelines, is_builtin) VALUES (?, ?, ?, ?, 0)`
  ).run(name, category, description, guidelines)
  return NextResponse.json({ id: result.lastInsertRowid, ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const template = db.prepare('SELECT is_builtin FROM resume_templates WHERE id = ?').get(id) as { is_builtin: number } | undefined
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (template.is_builtin) return NextResponse.json({ error: 'Cannot delete built-in templates' }, { status: 403 })
  db.prepare('DELETE FROM resume_templates WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
