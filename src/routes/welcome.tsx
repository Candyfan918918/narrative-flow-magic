import { createFileRoute } from '@tanstack/react-router'
import { WelcomeNativePage } from '@/pages/WelcomeNative'

export const Route = createFileRoute('/welcome')({
  head: () => ({ meta: [{ title: 'Welcome — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: WelcomeNativePage,
})
