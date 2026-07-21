import { NextResponse } from 'next/server'
import db from '@/lib/db'

export function GET() {
  const sessions = db.prepare(`SELECT COUNT(*) as count FROM sessions`).get() as { count: number }
  const tokens = db.prepare(`SELECT COALESCE(SUM(tokens_in),0) as ti, COALESCE(SUM(tokens_out),0) as to_ FROM token_log`).get() as { ti: number; to_: number }
  const apps = db.prepare(`SELECT COUNT(*) as count FROM applications`).get() as { count: number }
  const topSkill = db.prepare(`SELECT skill, COUNT(*) as n FROM sessions WHERE skill NOT LIKE '__%__' GROUP BY skill ORDER BY n DESC LIMIT 1`).get() as { skill: string } | undefined

  return NextResponse.json({
    totalSessions: sessions.count,
    totalTokensIn: tokens.ti,
    totalTokensOut: tokens.to_,
    totalApplications: apps.count,
    topSkill: topSkill?.skill ?? null,
  })
}
