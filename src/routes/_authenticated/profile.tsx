import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/pages/Profile'

export const Route = createFileRoute('/_authenticated/profile')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'your profile — shutap' },
      { name: 'description', content: 'edit, share, or delete your spills, scans, and journals.' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: ProfilePage,
})
