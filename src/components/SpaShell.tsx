/* Single shared SPA shell. Module-level singleton so TanStack route swaps
 * between `/` and `/$` reuse the SAME component instance — preventing the
 * BrowserRouter + iframe from being torn down and re-imported on every nav,
 * which was the main source of perceived slowness + the Transitioner
 * "setState during render" warning. */
import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

import { App } from '@/App'
import { installShareEngine } from '@/lib/share'
import { installFeedback } from '@/lib/feedback'

let installed = false

export function SpaShell() {
  useEffect(() => {
    if (installed) return
    installed = true
    try { installShareEngine() } catch {}
    try { installFeedback() } catch {}
  }, [])
  return (
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  )
}
