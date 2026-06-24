import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/$')({
  component: ClientApp,
})

function ClientApp() {
  const [Mounted, setMounted] = useState<null | (React.ComponentType)>(null)
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
