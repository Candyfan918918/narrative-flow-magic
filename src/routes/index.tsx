import { createFileRoute } from '@tanstack/react-router'
import { SpaShell } from '@/components/SpaShell'

const HOME_TITLE = "Shutap — finally, somewhere to not shut up."
const HOME_DESCRIPTION =
  "Pseudonymous venting community. Spill what's actually going on with your relationship, marriage, family, or work — someone in here has lived your exact thing."

export const Route = createFileRoute('/')({
  ssr: false,
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [
      { rel: "canonical", href: "/" },
      // Start the landing iframe document downloading in parallel with the
      // SPA JS bundle so the inner page is warm by the time React mounts it.
      { rel: "preload", as: "document", href: "/shutap/Shutap-Landing.dc.html" },
    ],
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
  component: SpaShell,
})
