import { createFileRoute } from '@tanstack/react-router'
import { HallOfFamePageNative } from '@/pages/Halls'

export const Route = createFileRoute('/halls')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Hall of Fame — Shutap' }] }),
  component: HallOfFamePageNative,
})
