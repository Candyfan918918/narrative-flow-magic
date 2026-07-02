import { createFileRoute } from '@tanstack/react-router'
import { MirrorPage } from '@/pages/Mirror'

export const Route = createFileRoute('/mirror')({
  ssr: false,
  head: () => ({ meta: [{ title: 'The Mirror — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: MirrorPage,
})
