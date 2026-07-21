import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join, extname } from 'path'
import { runClaude } from '@/lib/claude-cli'

const SCRIPTS_DIR = join(process.cwd(), 'scripts')

function runOCR(imagePath: string): string {
  const platform = process.platform
  try {
    if (platform === 'darwin') {
      const script = join(SCRIPTS_DIR, 'ocr.swift')
      return execSync(`swift "${script}" "${imagePath}"`, { timeout: 30_000, encoding: 'utf-8' }).trim()
    }
    if (platform === 'win32') {
      const script = join(SCRIPTS_DIR, 'ocr.ps1')
      return execSync(
        `powershell -ExecutionPolicy Bypass -File "${script}" "${imagePath}"`,
        { timeout: 30_000, encoding: 'utf-8' }
      ).trim()
    }
    return execSync(`tesseract "${imagePath}" stdout`, { timeout: 30_000, encoding: 'utf-8' }).trim()
  } catch (e) {
    const hint = platform === 'linux' ? ' (install: sudo apt-get install tesseract-ocr)' : ''
    throw new Error(`OCR failed${hint}: ${(e as Error).message}`)
  }
}

async function extractText(file: File): Promise<{ text: string; source: string }> {
  const mime = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  const buf = Buffer.from(await file.arrayBuffer())

  // PDF
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    // pdf-parse exports the function directly (no .default)
    const pdfParse = await import('pdf-parse') as unknown as (buf: Buffer) => Promise<{ text: string }>
    const data = await pdfParse(buf)
    return { text: data.text, source: 'pdf' }
  }

  // DOCX / DOC
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword' ||
    name.endsWith('.docx') || name.endsWith('.doc')
  ) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer: buf })
    return { text: result.value, source: 'docx' }
  }

  // Plain text
  if (mime.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
    return { text: buf.toString('utf-8'), source: 'text' }
  }

  // Image — run OCR
  if (mime.startsWith('image/')) {
    const ext = mime === 'image/png' ? 'png' : mime === 'image/gif' ? 'gif' : mime === 'image/webp' ? 'webp' : 'jpg'
    const tmpPath = join(tmpdir(), `udd-ocr-${Date.now()}.${ext}`)
    writeFileSync(tmpPath, buf)
    try {
      const text = runOCR(tmpPath)
      return { text, source: 'screenshot' }
    } finally {
      try { unlinkSync(tmpPath) } catch { /* ignore */ }
    }
  }

  throw new Error(`Unsupported file type: ${mime || extname(name) || 'unknown'}`)
}

const buildPrompt = (text: string) => `You are a job posting parser. Extract structured data and return ONLY valid JSON — no markdown, no explanation.

TEXT:
${text.slice(0, 12_000)}

Return this exact JSON shape:
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
- remote: true if fully remote or remote-first
- salary_range: e.g. "$180K–$220K" or "" if not stated
- jd_summary: 2–3 sentence plain-English summary
- key_skills: top 5–8 tech/skill keywords as an array
- referral_suggestions: 1 sentence on who to ask for a referral
- contacts: empty array []

Return only the JSON object.`

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  // Accept both 'file' (new) and 'image' (legacy) field names
  const file = (formData.get('file') ?? formData.get('image')) as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  try {
    const { text, source } = await extractText(file)

    if (!text.trim()) {
      return NextResponse.json({ error: 'No text found in file — try a clearer screenshot or copy-paste the text instead' }, { status: 422 })
    }

    const result = await runClaude(buildPrompt(text), '__tracker_ingest__')
    const raw = result.text.trim()
    const json = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(raw.replace(/^```json?\n?/, '').replace(/```$/, ''))
    const incomplete = !json.jd_summary || json.jd_summary.length < 30
    return NextResponse.json({ ...json, _source: source, _chars: text.length, _incomplete: incomplete })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
