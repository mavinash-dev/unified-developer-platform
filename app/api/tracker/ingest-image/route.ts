import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { runClaude } from '@/lib/claude-cli'

const SCRIPTS_DIR = join(process.cwd(), 'scripts')

function runOCR(imagePath: string): string {
  const platform = process.platform
  try {
    if (platform === 'darwin') {
      // macOS: Apple Vision framework (Live Text engine, no install needed)
      const script = join(SCRIPTS_DIR, 'ocr.swift')
      return execSync(`swift "${script}" "${imagePath}"`, { timeout: 30_000, encoding: 'utf-8' }).trim()
    }

    if (platform === 'win32') {
      // Windows 10+: Windows.Media.Ocr (built-in WinRT, no install needed)
      const script = join(SCRIPTS_DIR, 'ocr.ps1')
      return execSync(
        `powershell -ExecutionPolicy Bypass -File "${script}" "${imagePath}"`,
        { timeout: 30_000, encoding: 'utf-8' }
      ).trim()
    }

    // Linux: try tesseract (common on CI / developer machines)
    return execSync(`tesseract "${imagePath}" stdout`, { timeout: 30_000, encoding: 'utf-8' }).trim()

  } catch (e) {
    const hint = platform === 'linux'
      ? ' (install with: sudo apt-get install tesseract-ocr)'
      : ''
    throw new Error(`OCR failed${hint}: ${(e as Error).message}`)
  }
}

const buildPrompt = (text: string) => `You are a job posting parser. The following text was extracted via OCR from a screenshot. Extract structured data and return ONLY valid JSON — no markdown, no explanation.

OCR TEXT:
${text}

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
- remote: true if fully remote
- salary_range: e.g. "$180K–$220K" or ""
- jd_summary: 2–3 sentence plain-English summary of the role
- key_skills: top 5–8 tech/skill keywords as an array
- referral_suggestions: 1 sentence on who to ask for a referral at this company
- contacts: empty array []

Return only the JSON object.`

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'image required' }, { status: 400 })

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/gif' ? 'gif' : 'jpg'
  const tmpPath = join(tmpdir(), `udd-ocr-${Date.now()}.${ext}`)
  writeFileSync(tmpPath, Buffer.from(await file.arrayBuffer()))

  try {
    const ocrText = runOCR(tmpPath)
    if (!ocrText.trim()) {
      return NextResponse.json({ error: 'No text found in screenshot — try a clearer image or higher resolution' }, { status: 422 })
    }

    const result = await runClaude(buildPrompt(ocrText), '__tracker_ingest__')
    const raw = result.text.trim()
    const json = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(raw.replace(/^```json?\n?/, '').replace(/```$/, ''))
    return NextResponse.json({ ...json, _ocrChars: ocrText.length })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  } finally {
    try { unlinkSync(tmpPath) } catch { /* ignore */ }
  }
}
