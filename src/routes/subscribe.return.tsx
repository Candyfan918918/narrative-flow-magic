import { createFileRoute } from '@tanstack/react-router'
import { SubscribeReturnPage } from '@/pages/Subscribe'

export const Route = createFileRoute('/subscribe/return')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Subscribe · Return — Shutap' }] }),
  component: SubscribeReturnPage,
})
