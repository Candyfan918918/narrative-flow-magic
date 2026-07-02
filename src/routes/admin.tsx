import { createFileRoute } from '@tanstack/react-router'
import { AdminPage } from '@/pages/Admin'

export const Route = createFileRoute('/admin')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Admin — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminPage,
})
