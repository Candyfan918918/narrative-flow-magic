import { createFileRoute, redirect } from '@tanstack/react-router'

// Legacy email unsubscribe links used /unsubscribe (no /email prefix).
// Preserve any query params (e.g. ?token=...) when forwarding to the real route.
export const Route = createFileRoute('/unsubscribe')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/email/unsubscribe', search })
  },
})
