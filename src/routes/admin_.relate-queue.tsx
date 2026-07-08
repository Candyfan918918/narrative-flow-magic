import { createFileRoute } from '@tanstack/react-router'
import { AdminRelateQueuePage } from '@/pages/AdminRelateQueue'

export const Route = createFileRoute('/admin_/relate-queue')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Admin · Relate Queue — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminRelateQueuePage,
})
