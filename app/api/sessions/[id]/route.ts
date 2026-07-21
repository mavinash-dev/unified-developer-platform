import { NextResponse } from 'next/server'
import db from '@/lib/db'

export function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  return context.params.then(({ id }) => {
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id)
    return NextResponse.json(session ?? null)
  })
}
