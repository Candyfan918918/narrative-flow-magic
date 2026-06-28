/* Pixel-perfect port of handoff Stream.dc.html via iframe.
 * Forwards the parent route hash (e.g. /stream#room-<id>) into the iframe so
 * `openRoomPage` actually runs when you arrive from a fresh spill publish. */
import { useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function StreamPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { hash } = useLocation()
  // Initial src carries the hash so the prototype's routeHash() fires on first load.
  const initialSrc = useMemo(
    () => '/shutap/Shutap-Stream.html' + (hash || ''),
    // intentionally lock to first render — later hash changes are forwarded via postMessage
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  // Forward later hash changes without reloading the iframe.
  useEffect(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    try {
      const current = win.location.hash
      if (current !== hash) {
        win.location.hash = hash || ''
      }
    } catch {
      /* cross-origin not expected — same-origin /shutap path */
    }
  }, [hash])
  return (
    <iframe
      ref={iframeRef}
      src={initialSrc}
      title="Shutap — Stream"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, margin: 0, padding: 0, background: '#fdf0f5' }}
    />
  )
}
