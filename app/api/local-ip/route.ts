import { NextResponse } from 'next/server'
import os from 'os'

function getLocalIP(): string {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return '127.0.0.1'
}

export function GET() {
  const ip = getLocalIP()
  const port = process.env.PORT ?? '3000'
  const hasVision = !!process.env.ANTHROPIC_API_KEY
  return NextResponse.json({
    ip,
    port,
    dropUrl: `http://${ip}:${port}/drop`,
    hasVision,
  })
}
