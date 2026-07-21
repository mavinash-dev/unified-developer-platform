import { NextRequest, NextResponse } from 'next/server'
import { runAtsScore } from '@/lib/ats'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  const { resumeText, jdText, resumeId } = await req.json()

  if (!resumeText || !jdText) {
    return NextResponse.json({ error: 'resumeText and jdText are required' }, { status: 400 })
  }

  const result = await runAtsScore(resumeText, jdText)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Persist scan result if tied to a saved resume
  if (resumeId) {
    db.prepare(`
      INSERT INTO ats_scans (resume_id, score, tfidf_score, keyword_score, keyword_data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      resumeId,
      result.final_score,
      result.tfidf_similarity,
      result.keyword_match,
      JSON.stringify({ matched: result.matched_keywords, missing: result.missing_keywords })
    )

    db.prepare(`UPDATE resumes SET ats_score = ? WHERE id = ?`)
      .run(result.final_score, resumeId)
  }

  return NextResponse.json(result)
}
