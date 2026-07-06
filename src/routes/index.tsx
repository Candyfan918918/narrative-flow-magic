import { createFileRoute } from '@tanstack/react-router'
import { LandingNativePage } from '@/pages/landing/LandingPage'
import { SITE_URL } from '@/lib/site'

const HOME_TITLE = "Shutap — vent about relationships, marriage, family, work"
const HOME_DESCRIPTION =
  "Spill what's actually going on — relationship, marriage, family, or work. Pseudonymous, judgment-free. Say what you can't say anywhere else."
const HOME_URL = `${SITE_URL}/`

export const Route = createFileRoute('/')({
  headers: () => ({
    'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
  }),
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

function HomeRoute() {
  return <LandingNativePage />
}
