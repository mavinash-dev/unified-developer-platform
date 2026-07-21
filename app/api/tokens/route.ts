import { NextResponse } from 'next/server'
import db from '@/lib/db'

export function GET() {
  const today = new Date().toISOString().split('T')[0]
  const month = today.slice(0, 7) // '2026-07'

  const daily = db.prepare(`
    SELECT COALESCE(SUM(tokens_in),0) as tokens_in,
           COALESCE(SUM(tokens_out),0) as tokens_out
    FROM token_log WHERE date = ?
  `).get(today) as { tokens_in: number; tokens_out: number }

  const monthly = db.prepare(`
    SELECT COALESCE(SUM(tokens_in),0) as tokens_in,
           COALESCE(SUM(tokens_out),0) as tokens_out
    FROM token_log WHERE date LIKE ?
  `).get(`${month}%`) as { tokens_in: number; tokens_out: number }

  const bySkill = db.prepare(`
    SELECT skill,
           COALESCE(SUM(tokens_in),0) as tokens_in,
           COALESCE(SUM(tokens_out),0) as tokens_out
    FROM token_log WHERE date = ?
    GROUP BY skill
  `).all(today)

  const dailyLimit = parseInt(process.env.DAILY_TOKEN_LIMIT ?? '100000')
  const monthlyLimit = parseInt(process.env.MONTHLY_TOKEN_LIMIT ?? '1000000')

  return NextResponse.json({
    daily: {
      total: daily.tokens_in + daily.tokens_out,
      in: daily.tokens_in,
      out: daily.tokens_out,
      limit: dailyLimit,
      pct: Math.round(((daily.tokens_in + daily.tokens_out) / dailyLimit) * 100),
    },
    monthly: {
      total: monthly.tokens_in + monthly.tokens_out,
      in: monthly.tokens_in,
      out: monthly.tokens_out,
      limit: monthlyLimit,
      pct: Math.round(((monthly.tokens_in + monthly.tokens_out) / monthlyLimit) * 100),
    },
    bySkill,
  })
}
