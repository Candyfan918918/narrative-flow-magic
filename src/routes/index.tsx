import { createFileRoute } from '@tanstack/react-router'
import { LandingNativePage } from '@/pages/landing/LandingPage'
import { SITE_URL } from '@/lib/site'

const HOME_TITLE = "Shutap — finally, somewhere to not shut up."
const HOME_DESCRIPTION =
  "Pseudonymous venting community. Spill what's actually going on with your relationship, marriage, family, or work — someone in here has lived your exact thing."
const HOME_URL = `${SITE_URL}/`

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: HOME_TITLE },
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
  component: LandingNativePage,
})
