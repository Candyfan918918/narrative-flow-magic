// Client-side helper for firing behavioral events to the server.
import { trackEvent } from '@/lib/behavioral.functions'

let trackFn: ((args: { data: { kind: string; payload?: Record<string, unknown> } }) => Promise<unknown>) | null = null

export function bindTrack(fn: typeof trackFn) { trackFn = fn }

export async function track(kind: string, payload?: Record<string, unknown>) {
  try {
    if (trackFn) {
      await trackFn({ data: { kind, payload } })
    } else {
      // server-fn call is also safe to invoke directly
      await trackEvent({ data: { kind, payload } })
    }
  } catch { /* non-blocking */ }
}
