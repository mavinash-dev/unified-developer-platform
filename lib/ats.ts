import { execFile } from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs'

const ATS_SCRIPT = path.join(os.homedir(), '.claude', 'scripts', 'ats_score.py')

export interface AtsResult {
  tfidf_similarity: number
  keyword_match: number
  final_score: number
  threshold: number
  pass: boolean
  matched_keywords: string[]
  missing_keywords: string[]
  structural_issues: string[]
  error?: string
}

export async function runAtsScore(resumeText: string, jdText: string): Promise<AtsResult> {
  const resumeFile = path.join(os.tmpdir(), `resume_${Date.now()}.txt`)
  const jdFile = path.join(os.tmpdir(), `jd_${Date.now()}.txt`)

  fs.writeFileSync(resumeFile, resumeText)
  fs.writeFileSync(jdFile, jdText)

  return new Promise((resolve) => {
    execFile('python3', [ATS_SCRIPT, resumeFile, jdFile], (err, stdout) => {
      fs.unlinkSync(resumeFile)
      fs.unlinkSync(jdFile)

      if (err) {
        resolve({ error: err.message } as AtsResult)
        return
      }
      try {
        resolve(JSON.parse(stdout) as AtsResult)
      } catch {
        resolve({ error: 'Failed to parse ATS output' } as AtsResult)
      }
    })
  })
}
