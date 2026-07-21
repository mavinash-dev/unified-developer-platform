import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const EXTRACT_PROMPT = `You are a job posting parser looking at a screenshot. Extract structured data and return ONLY valid JSON — no markdown, no explanation, no code fences.

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
- company: hiring company name
- role: exact job title
- location: city/country or "Remote"
- remote: true if fully remote
- salary_range: e.g. "$180K–$220K" or ""
- jd_summary: 2–3 sentence plain-English summary of what the role does
- key_skills: top 5–8 tech/skill keywords from the posting
- referral_suggestions: 1 sentence on who to ask for a referral
- contacts: empty array []

Return only the JSON object.`

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set — add it to .env.local to enable screenshot parsing' },
      { status: 501 }
    )
  }

  const formData = await req.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'image required' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: EXTRACT_PROMPT },
        ],
      }],
    })

    const raw = (msg.content[0] as { text: string }).text.trim()
    const json = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(raw.replace(/^```json?\n?/, '').replace(/```$/, ''))
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ error: `vision extraction failed: ${(e as Error).message}` }, { status: 500 })
  }
}
