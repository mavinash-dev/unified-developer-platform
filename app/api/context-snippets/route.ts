import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

interface Snippet { id: number; label: string; content: string; created_at: string; updated_at: string }

export function GET() {
  const rows = db.prepare(`SELECT * FROM context_snippets ORDER BY created_at ASC`).all() as Snippet[]
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { label, content = '' } = await req.json()
  if (!label?.trim()) return NextResponse.json({ error: 'label required' }, { status: 400 })
  const result = db.prepare(
    `INSERT INTO context_snippets (label, content) VALUES (?, ?)`
  ).run(label.trim(), content)
  const row = db.prepare(`SELECT * FROM context_snippets WHERE id = ?`).get(result.lastInsertRowid)
  return NextResponse.json(row, { status: 201 })
}
