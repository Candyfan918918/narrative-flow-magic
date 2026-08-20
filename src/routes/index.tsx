import { createFileRoute } from '@tanstack/react-router'
import { ogImageMeta } from "@/lib/seo/meta";
import { HomePage } from '@/pages/home/HomePage'
import { HOME_FAQ } from '@/pages/home/HomeFAQ'
import { SITE_URL } from '@/lib/site'
import { countOpenRooms } from '@/lib/rooms-count.functions'
import { listNewestRooms } from '@/lib/newest-rooms.functions'

const HOME_TITLE = "Shutap — vent about relationships, marriage, family, work"
const HOME_DESCRIPTION =
  "Vent like it's your smartest friend. The easiest way to get it off your chest — type it, spill it, someone always replies. Your real name never shows."
const HOME_OG_DESCRIPTION =
  "Vent like it's your smartest friend. The easiest way to get it off your chest — type it, spill it, someone always replies. Your real name never shows."
const HOME_URL = `${SITE_URL}/`

export const Route = createFileRoute('/')({
  headers: () => ({
    'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
  }),
  loader: async () => {
    const [openRooms, newestRooms] = await Promise.all([
      countOpenRooms().catch(() => 0),
      listNewestRooms().catch(() => []),
    ])
    return { openRooms, newestRooms }
  },
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: "Shutap. Speak Up." },
      { property: "og:description", content: HOME_OG_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: HOME_URL },
      ...ogImageMeta(),
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
          "@id": `${SITE_URL}/#website`,
          name: "Shutap",
          alternateName: "Shutap. Speak Up.",
          url: HOME_URL,
          inLanguage: "en",
          description:
            "Vent like it's your smartest friend. The easiest way to get it off your chest — type it, spill it, someone always replies. Your real name never shows.",
          // Ties this WebSite node to the Organization node emitted in
          // __root.tsx so crawlers read one entity, not two.
          publisher: { "@id": `${SITE_URL}/#organization` },
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
  const { openRooms, newestRooms } = Route.useLoaderData()
  return <HomePage openRoomsCount={openRooms} newestRooms={newestRooms} />
}
