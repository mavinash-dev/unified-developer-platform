import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

type Params = Promise<{ id: string }>

export async function PATCH(req: NextRequest, context: { params: Params }) {
  const { id } = await context.params
  const { label, content } = await req.json()
  const fields: string[] = []
  const values: unknown[] = []
  if (label !== undefined) { fields.push('label = ?'); values.push(label) }
  if (content !== undefined) { fields.push('content = ?'); values.push(content) }
  if (!fields.length) return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  fields.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)
  db.prepare(`UPDATE context_snippets SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return NextResponse.json(db.prepare(`SELECT * FROM context_snippets WHERE id = ?`).get(id))
}

export async function DELETE(_req: NextRequest, context: { params: Params }) {
  const { id } = await context.params
  db.prepare(`DELETE FROM context_snippets WHERE id = ?`).run(id)
  return NextResponse.json({ ok: true })
}
