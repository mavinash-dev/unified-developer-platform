import { NextResponse } from 'next/server'
import { writeUDDContext, ensureContextFileRegistered, generateUDDContext } from '@/lib/generate-context'

// GET — preview the current context without writing
export function GET() {
  return NextResponse.json({ content: generateUDDContext() })
}

// POST — regenerate and write ~/.udd/udd-context.md, register in user.json
export function POST() {
  ensureContextFileRegistered()
  const filePath = writeUDDContext()
  return NextResponse.json({ ok: true, filePath })
}
