import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

const HOME_TITLE = "Shutap — finally, somewhere to not shut up."
const HOME_DESCRIPTION =
  "Pseudonymous venting community. Spill what's actually going on with your relationship, marriage, family, or work — someone in here has lived your exact thing."

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Shutap",
          url: "/",
          description:
            "Shutap is a pseudonymous community where people vent about relationships, marriage, family, and work — and share what actually happened next.",
        }),
      },
    ],
  }),
  component: ClientApp,
})

function ClientApp() {
  const [Mounted, setMounted] = useState<null | (React.ComponentType)>(null)
  useEffect(() => {
    let cancelled = false
    Promise.all([
      import('react-router-dom'),
      import('@/App'),
      import('@/lib/share'),
      import('@/lib/feedback'),
    ]).then(([rr, appMod, share, fb]) => {
      if (cancelled) return
      share.installShareEngine()
      fb.installFeedback()
      const { BrowserRouter } = rr
      const { App } = appMod
      setMounted(() => () => (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      ))
    })
    return () => {
      cancelled = true
    }
  }, [])
  // Render nothing while the SPA chunk loads — a fleeting blank beats the
  // unstyled SSR placeholder the user was seeing.
  if (!Mounted) return null
  return <Mounted />
}


