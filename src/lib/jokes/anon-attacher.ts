// Sends the guest session id as a request header on every server-function call.
//
// It is a rate-limit subject key and nothing else: it carries no tier, grants
// no access, and the server treats it as untrusted input. It clears the moment
// the browser's storage is cleared, which is why the server also throttles by
// network address as a separate layer.
import { createMiddleware } from '@tanstack/react-start'

export const ANON_HEADER = 'x-shutap-anon'
const ANON_KEY = 'shutap_anon_id'

export const attachJokeSession = createMiddleware({ type: 'function' }).client(async ({ next }) => {
  // `.client()` also runs during SSR, where there is no browser storage.
  if (typeof window === 'undefined') return next()
  let id = ''
  try {
    id = localStorage.getItem(ANON_KEY) ?? ''
  } catch {
    id = ''
  }
  if (!id) return next()
  return next({ headers: { [ANON_HEADER]: id } })
})
