import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export function GET() {
  const resumes = db.prepare(`
    SELECT r.*,
           (SELECT score FROM ats_scans WHERE resume_id = r.id ORDER BY scanned_at DESC LIMIT 1) as latest_ats
    FROM resumes r
    ORDER BY r.created_at DESC
  `).all()
  return NextResponse.json(resumes)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { company, role, ats_score, format, file_path, compatibility } = body

  const result = db.prepare(`
    INSERT INTO resumes (company, role, ats_score, format, file_path, compatibility)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(company, role, ats_score, format ?? 'markdown', file_path, compatibility)

  return NextResponse.json({ id: result.lastInsertRowid })
}
