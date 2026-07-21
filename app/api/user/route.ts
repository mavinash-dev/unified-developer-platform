import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

const CONFIG_DIR = path.join(os.homedir(), '.udd')
const CONFIG_FILE = path.join(CONFIG_DIR, 'user.json')

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
