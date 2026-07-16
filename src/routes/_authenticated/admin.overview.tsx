import { createFileRoute } from '@tanstack/react-router'
import { AdminPage } from '@/pages/Admin'

export const Route = createFileRoute('/_authenticated/admin/overview')({
  head: () => ({ meta: [{ title: 'Admin · Overview — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminPage,
})
