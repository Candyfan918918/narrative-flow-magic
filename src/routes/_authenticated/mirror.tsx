import { createFileRoute } from '@tanstack/react-router'
import { MirrorPage } from '@/pages/Mirror'

export const Route = createFileRoute('/_authenticated/mirror')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'The Mirror — Shutap' },
      {
        name: 'description',
        content:
          'Your private mirror — a living portrait of your spills, scans, and check-ins over time.',
      },
    ],
  }),
  component: MirrorPage,
})
