import { createFileRoute } from '@tanstack/react-router'
import { SubscribePage } from '@/pages/Subscribe'

export const Route = createFileRoute('/subscribe')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Subscribe — Shutap' }] }),
  component: SubscribePage,
})
