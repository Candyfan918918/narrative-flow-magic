import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/analytics')({
  beforeLoad: () => {
    throw redirect({ to: '/admin' })
  },
  component: () => null,
})
