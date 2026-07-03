import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LandingNativePage } from '@/pages/landing/LandingPage'
import { SITE_URL } from '@/lib/site'

const HOME_TITLE = "Shutap — vent about relationships, marriage, family, work"
const HOME_DESCRIPTION =
  "Spill what's actually going on — relationship, marriage, family, or work. Pseudonymous, judgment-free. Say what you can't say anywhere else."
const HOME_URL = `${SITE_URL}/`

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: "Shutap. Speak Up." },
      { property: "og:description", content: HOME_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: HOME_URL },
    ],
    links: [
      { rel: "canonical", href: HOME_URL },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Shutap",
          url: HOME_URL,
          description:
            "Shutap is a pseudonymous community with AI agents' assistance to help people express and vent their personal experiences in a safe space.",
        }),
      },
    ],
  }),
  component: HomeRoute,
})

/**
 * Server-rendered semantic hero for crawlers (especially non-JS bots).
 * Present in the initial HTML so view-source shows the h1, intro copy,
 * and pillar links. After hydration the interactive LandingNativePage
 * takes over and this hero is unmounted — same message, richer UX.
 * Not cloaking: content parity with the client landing.
 */
function SeoHero() {
  const NEWSREADER = "'Newsreader', Georgia, serif"
  const SORA = "'Sora', system-ui, sans-serif"
  const linkStyle: React.CSSProperties = {
    color: '#c1216b',
    borderBottom: '1px solid rgba(193,33,107,.3)',
    textDecoration: 'none',
    fontFamily: NEWSREADER,
    fontStyle: 'italic',
    fontSize: 15,
  }
  return (
    <section
      aria-label="Shutap introduction"
      style={{
        background: '#fdf0f5',
        color: '#0b080f',
        padding: '56px 22px 40px',
      }}
    >
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: NEWSREADER,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(30px,6vw,50px)',
            lineHeight: 1.15,
            letterSpacing: '-.015em',
            margin: '0 0 20px',
            color: '#0b080f',
          }}
        >
          finally, somewhere to not shut up.
        </h1>
        <p
          style={{
            fontFamily: NEWSREADER,
            fontStyle: 'italic',
            fontSize: 18,
            lineHeight: 1.6,
            color: '#4a3040',
            margin: '0 0 20px',
            maxWidth: '52ch',
          }}
        >
          let it all out — and you're not the only one who's been through this. spill it; someone in here has lived your exact thing.
        </p>
        <p
          style={{
            fontFamily: NEWSREADER,
            fontSize: 16,
            lineHeight: 1.65,
            color: '#4a3040',
            margin: '0 0 24px',
            maxWidth: '60ch',
          }}
        >
          Shutap is a pseudonymous community with AI agents' assistance to help people express and vent their personal experiences in a safe space. Vent about relationships, marriage, family, and work under an alias — never your real name — and come back to share what actually happened next.
        </p>
        <nav
          aria-label="Explore Shutap"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 20px',
            marginBottom: 24,
          }}
        >
          <a href="/relationships" style={linkStyle}>relationships</a>
          <a href="/marriage" style={linkStyle}>marriage</a>
          <a href="/family" style={linkStyle}>family</a>
          <a href="/career" style={linkStyle}>career &amp; work</a>
          <a href="/lived-intelligence" style={linkStyle}>what is lived intelligence?</a>
          <a href="/faq" style={linkStyle}>faq</a>
        </nav>
        <p
          style={{
            fontFamily: SORA,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: '#c1216b',
            margin: 0,
          }}
        >
          Shutap. Speak Up.
        </p>
      </div>
    </section>
  )
}

function HomeRoute() {
  // Render the SEO hero during SSR and the first client render so hydration
  // matches. After mount, unmount the hero — the interactive landing below
  // carries the same message with richer UX.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return (
    <>
      {!hydrated && <SeoHero />}
      <LandingNativePage />
    </>
  )
}
