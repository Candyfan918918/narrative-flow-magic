import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({
  ssr: false,
  component: ClientApp,
})

function ClientApp() {
  const [Mounted, setMounted] = useState<null | (() => JSX.Element)>(null)
  useEffect(() => {
    let cancelled = false
    Promise.all([import('react-router-dom'), import('@/App'), import('@/lib/share')]).then(
      ([rr, appMod, share]) => {
        if (cancelled) return
        share.installShareEngine()
        const { BrowserRouter } = rr
        const { App } = appMod
        setMounted(() => () => (
          <BrowserRouter>
            <App />
          </BrowserRouter>
        ))
      },
    )
    return () => {
      cancelled = true
    }
  }, [])
  if (!Mounted) return null
  return <Mounted />
}
