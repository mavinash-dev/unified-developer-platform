import { NextResponse } from 'next/server'
import fs from 'fs'
import { DB_PATH, UDD_DIR } from '@/lib/paths'

export async function POST() {
  const deleted: string[] = []
  const errors: string[] = []

  const targets = [DB_PATH, UDD_DIR]

  // If nothing to delete, already clean
  const anyExists = targets.some(t => fs.existsSync(t))
  if (!anyExists) {
    return NextResponse.json({ ok: true, alreadyClean: true, deleted: [] })
  }

  for (const target of targets) {
    try {
      if (fs.existsSync(target)) {
        const stat = fs.statSync(target)
        if (stat.isDirectory()) {
          fs.rmSync(target, { recursive: true, force: true })
        } else {
          fs.unlinkSync(target)
        }
        deleted.push(target)
      }
    } catch (e) {
      errors.push(`${target}: ${(e as Error).message}`)
    }
  }

  if (errors.length) {
    return NextResponse.json({ ok: false, errors }, { status: 500 })
  }

  return NextResponse.json({ ok: true, alreadyClean: false, deleted })
}
