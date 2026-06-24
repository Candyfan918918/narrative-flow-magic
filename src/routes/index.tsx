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

/**
 * SSR-visible hero so crawlers and AI assistants see the brand voice + entity
 * sentence without executing JS. The client SPA mounts on top once hydrated.
 */
function SsrHero() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        finally, somewhere to <em>not</em> shut up.
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        venting is free therapy — and you're not the only one who's been
        through this. spill it; someone in here has lived your exact thing.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        pseudonymous · your real name never shows · your story, your rules
      </p>
      <nav aria-label="Topics" className="mt-10 grid gap-4 sm:grid-cols-2">
        <a href="/relationships" className="rounded-lg border border-border p-4 hover:bg-accent">
          <span className="block font-semibold">relationships</span>
          <span className="block text-sm text-muted-foreground">
            dating, partners, situationships, breakups
          </span>
        </a>
        <a href="/marriage" className="rounded-lg border border-border p-4 hover:bg-accent">
          <span className="block font-semibold">marriage</span>
          <span className="block text-sm text-muted-foreground">
            the long-haul stuff you can't say at brunch
          </span>
        </a>
        <a href="/family" className="rounded-lg border border-border p-4 hover:bg-accent">
          <span className="block font-semibold">family</span>
          <span className="block text-sm text-muted-foreground">
            parents, siblings, in-laws, the group chat, the guilt
          </span>
        </a>
        <a href="/career" className="rounded-lg border border-border p-4 hover:bg-accent">
          <span className="block font-semibold">career</span>
          <span className="block text-sm text-muted-foreground">
            work, money, bosses, burnout
          </span>
        </a>
      </nav>
    </div>
  )
}

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
  if (!Mounted) return <SsrHero />
  return <Mounted />
}

