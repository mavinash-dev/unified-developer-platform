import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const skill = searchParams.get('skill')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const sessions = skill
    ? db.prepare(`SELECT id, skill, category, model, tokens_in, tokens_out, args, created_at FROM sessions WHERE skill = ? ORDER BY created_at DESC LIMIT ?`).all(skill, limit)
    : db.prepare(`SELECT id, skill, category, model, tokens_in, tokens_out, args, created_at FROM sessions ORDER BY created_at DESC LIMIT ?`).all(limit)

  return NextResponse.json(sessions)
}

// GET single session with full output
export function GET_one(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id)
  return NextResponse.json(session ?? null)
}
