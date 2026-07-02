import { createFileRoute } from '@tanstack/react-router'
import { AdminFeedbackPage } from '@/pages/AdminFeedback'

export const Route = createFileRoute('/admin/feedback')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Admin · Feedback — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminFeedbackPage,
})
