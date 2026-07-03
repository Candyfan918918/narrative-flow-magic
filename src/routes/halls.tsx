import { createFileRoute } from '@tanstack/react-router'
import { HallOfFamePageNative } from '@/pages/Halls'
import { SITE_URL } from '@/lib/site'

const PATH = '/halls'
const TITLE = 'Hall of Fame — Shutap'
const DESCRIPTION =
  'Browse Shutap Halls of Fame: the most-resonated pseudonymous stories across relationships, marriage, family, and work — grouped by region and time window.'

export const Route = createFileRoute('/halls')({
  ssr: false,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: `${SITE_URL}${PATH}` },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}${PATH}` }],
  }),
  component: HallOfFamePageNative,
})
