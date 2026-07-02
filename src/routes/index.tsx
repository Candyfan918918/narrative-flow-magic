import { createFileRoute } from '@tanstack/react-router'
import { SpaShell } from '@/components/SpaShell'
import { SITE_URL } from '@/lib/site'

const HOME_TITLE = "Shutap — finally, somewhere to not shut up."
const HOME_DESCRIPTION =
  "Pseudonymous venting community. Spill what's actually going on with your relationship, marriage, family, or work — someone in here has lived your exact thing."
const HOME_URL = `${SITE_URL}/`

export const Route = createFileRoute('/')({
  ssr: false,
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
      // Start the landing iframe document downloading in parallel with the
      // SPA JS bundle so the inner page is warm by the time React mounts it.
      { rel: "preload", as: "document", href: "/shutap/Landing.dc.html" },
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
  component: SpaShell,
})
