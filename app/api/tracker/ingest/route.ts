import { NextRequest, NextResponse } from 'next/server'
import { runClaude } from '@/lib/claude-cli'

export async function POST(req: NextRequest) {
  const { text, url } = await req.json()
  const input = (text || url || '').trim()
  if (!input) return NextResponse.json({ error: 'text or url required' }, { status: 400 })

  const prompt = `You are a job posting parser. Extract structured data from the following job posting and return ONLY valid JSON — no markdown, no explanation, no code fences.

Input:
${input}

Return this exact JSON shape (fill in what you can, leave blanks as empty string or empty array):
{
  "company": "",
  "role": "",
  "location": "",
  "remote": false,
  "salary_range": "",
  "jd_summary": "",
  "key_skills": [],
  "referral_suggestions": "",
  "contacts": []
}

Rules:
- company: the hiring company name
- role: exact job title
- location: city/country or "Remote"
- remote: true if fully remote, false otherwise
- salary_range: e.g. "$180K–$220K" or ""
- jd_summary: 2–3 sentence plain-English summary of what the role does
- key_skills: top 5–8 tech/skill keywords from the JD as an array of strings
- referral_suggestions: 1 sentence on who at the company to ask for a referral (e.g. "Look for engineers on the Payments team at Stripe on LinkedIn")
- contacts: empty array [] — the user will add contacts manually

Return only the JSON object.`

  try {
    const result = await runClaude(prompt, '__tracker_ingest__')
    const raw = result.text.trim()
    const json = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(raw.replace(/^```json?\n?/, '').replace(/```$/, ''))
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ error: `extraction failed: ${(e as Error).message}` }, { status: 500 })
  }
}
