import { createFileRoute, redirect } from '@tanstack/react-router'

// Legacy email preferences links used /preferences (no /email prefix).
// Preserve any query params (e.g. ?token=...) when forwarding to the real route.
export const Route = createFileRoute('/preferences')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/email/preferences', search: search as never })
  },
})
