import { NextResponse } from 'next/server'
import { VERSION, PREV, NEXT } from '@/lib/version'

export function GET() {
  return NextResponse.json({ version: VERSION, prev: PREV, next: NEXT })
}
