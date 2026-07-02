import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/pages/Profile'

export const Route = createFileRoute('/profile')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Profile — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: ProfilePage,
})
