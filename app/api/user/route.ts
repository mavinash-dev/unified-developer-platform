import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { UDD_DIR as CONFIG_DIR, USER_FILE as CONFIG_FILE } from '@/lib/paths'

interface UserConfig {
  name: string
  contextFiles: string[]   // paths to facts.md, company-context.md, etc.
  createdAt: string
}

function readConfig(): UserConfig | null {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return null
  }
}

export function GET() {
  const config = readConfig()
  return NextResponse.json(config ?? { name: null, contextFiles: [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const existing = readConfig()
  const config: UserConfig = {
    name: body.name ?? existing?.name ?? '',
    contextFiles: body.contextFiles ?? existing?.contextFiles ?? [],
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  }
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  return NextResponse.json({ ok: true, config })
}
