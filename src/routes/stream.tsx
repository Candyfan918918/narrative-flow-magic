import { createFileRoute } from '@tanstack/react-router'
import { StreamPage } from '@/pages/Stream'
import { SITE_URL } from '@/lib/site'

export const Route = createFileRoute('/stream')({
  head: () => ({
    meta: [
      { title: 'rooms — Shutap' },
      { name: 'description', content: 'rooms people opened from their own material — read what is going on right now.' },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/stream` }],
  }),
  component: StreamPage,
})
