// In-process broadcast bus for mobile → desktop drop notifications.
// Each SSE client registers a callback; ingest-and-save calls emit() on save.

type Listener = (data: string) => void

const listeners = new Set<Listener>()

export function subscribe(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function emit(payload: object) {
  const data = `data: ${JSON.stringify(payload)}\n\n`
  for (const fn of listeners) fn(data)
}
