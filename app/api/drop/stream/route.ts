import { subscribe } from '@/lib/drop-bus'

export const dynamic = 'force-dynamic'

export function GET() {
  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Keep-alive ping every 25s so the connection doesn't time out
      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { clearInterval(ping) }
      }, 25_000)

      unsubscribe = subscribe((data) => {
        try { controller.enqueue(encoder.encode(data)) } catch { /* client disconnected */ }
      })
    },
    cancel() {
      unsubscribe?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
