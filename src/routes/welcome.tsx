import { createFileRoute } from '@tanstack/react-router'
import { WelcomeNativePage } from '@/pages/WelcomeNative'

export const Route = createFileRoute('/welcome')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Welcome — Shutap' }, { name: 'robots', content: 'noindex' }],
    styles: [
      { children: 'html,body{background:#1a0a12}' },
    ],
  }),
  component: WelcomeNativePage,
})
