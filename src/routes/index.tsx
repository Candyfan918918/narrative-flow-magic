import { createFileRoute } from '@tanstack/react-router'
import { ogImageMeta } from "@/lib/seo/meta";
import { HomePage } from '@/pages/home/HomePage'
import { HOME_FAQ } from '@/pages/home/HomeFAQ'
import { SITE_URL } from '@/lib/site'
import { countOpenRooms } from '@/lib/rooms-count.functions'

const HOME_TITLE = "Shutap — vent about relationships, marriage, family, work"
const HOME_DESCRIPTION =
  "Spill what's actually going on — relationships, marriage, family, or work. Pseudonymous venting with AI-guided support — someone in here has lived your exact thing."
const HOME_OG_DESCRIPTION =
  "whatever it is — someone in here has lived it. spill your stories: relationships, marriage, family, work — and see what happened next."
const HOME_URL = `${SITE_URL}/`

export const Route = createFileRoute('/')({
  headers: () => ({
    'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
  }),
  loader: async () => {
    const openRooms = await countOpenRooms().catch(() => 0)
    return { openRooms }
  },
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: "Shutap. Speak Up." },
      { property: "og:description", content: HOME_OG_DESCRIPTION },
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
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HOME_FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: HomeRouteComponent,
})

function HomeRouteComponent() {
  const { openRooms } = Route.useLoaderData()
  return <HomePage openRoomsCount={openRooms} />
}
