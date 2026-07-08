import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { HallOfFamePageNative } from '@/pages/Halls'
import { SITE_URL } from '@/lib/site'

const PATH = '/halls'
const TITLE = 'Hall of Fame — Shutap'
const DESCRIPTION =
  'Browse Shutap Halls of Fame: the most-resonated pseudonymous stories across relationships, marriage, family, and work — grouped by region and time window.'

function HallsRoot() {
  const { pathname } = useLocation()
  // Flat-file routing makes /halls/$hall/$region/$window a child of this
  // route. Render the hub only on the exact /halls path; otherwise defer
  // to the child route via <Outlet />.
  const normalized = pathname.replace(/\/+$/, '')
  if (normalized === '/halls' || normalized === '') return <HallOfFamePageNative />
  return <Outlet />
}

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
  component: HallsRoot,
})
