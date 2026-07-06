/* Module-level ref to the client-side router instance.
 *
 * Only set in the browser — on the server the router is created per-request
 * and MUST NOT leak across requests. Consumers should treat the ref as
 * optional and fall back to `window.location` when it isn't populated. */
type MinimalRouter = {
  navigate: (opts: unknown) => unknown
  history: { push: (url: string, state?: unknown) => void; replace: (url: string, state?: unknown) => void }
}

let ref: MinimalRouter | null = null

export function setRouterRef(router: MinimalRouter): void {
  if (typeof window === 'undefined') return
  ref = router
}

export function getRouterRef(): MinimalRouter | null {
  if (typeof window === 'undefined') return null
  return ref
}
