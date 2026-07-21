import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// Fire-and-forget endpoint for mobile drop zone:
// Upload file → OCR → extract → dedup check → auto-save to tracker
// Returns immediately with what was created (or skipped if duplicate)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Step 1: extract via the existing ingest-image pipeline
  const form = new FormData()
  form.append('file', file)

  const ingestRes = await fetch(new URL('/api/tracker/ingest-image', req.url), {
    method: 'POST',
    body: form,
  })

  const extracted = await ingestRes.json() as {
    company?: string; role?: string; location?: string; remote?: boolean
    salary_range?: string; jd_summary?: string; key_skills?: string[]
    _source?: string; error?: string
  }

  if (extracted.error || !extracted.company || !extracted.role) {
    return NextResponse.json({
      ok: false,
      error: extracted.error ?? 'Could not extract company or role from file',
    }, { status: 422 })
  }

  const source = extracted._source ?? 'mobile-drop'

  // Step 2: dedup check
  const existing = db.prepare(
    `SELECT id, company, role, status FROM applications WHERE lower(company) = lower(?) AND lower(role) = lower(?)`
  ).all(extracted.company, extracted.role) as { id: number; company: string; role: string; status: string }[]

  if (existing.length > 0) {
    return NextResponse.json({
      ok: false,
      skipped: true,
      reason: 'duplicate',
      existing: existing[0],
      extracted: { company: extracted.company, role: extracted.role },
    })
  }

  // Step 3: save
  const result = db.prepare(`
    INSERT INTO applications (company, role, location, remote, salary_range, jd_summary, key_skills, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    extracted.company, extracted.role,
    extracted.location ?? '', extracted.remote ? 1 : 0,
    extracted.salary_range ?? '', extracted.jd_summary ?? '',
    JSON.stringify(extracted.key_skills ?? []), source
  )

  return NextResponse.json({
    ok: true,
    id: result.lastInsertRowid,
    company: extracted.company,
    role: extracted.role,
    source,
  })
}
