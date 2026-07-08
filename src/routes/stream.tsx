import { createFileRoute } from '@tanstack/react-router'
import { StreamPage } from '@/pages/Stream'
import { SITE_URL } from '@/lib/site'

export const Route = createFileRoute('/stream')({
  head: () => ({
    meta: [
      { title: 'Stream — Shutap' },
      { name: 'description', content: 'Live venting stream — see what people are carrying right now.' },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/stream` }],
  }),
  component: StreamPage,
})
