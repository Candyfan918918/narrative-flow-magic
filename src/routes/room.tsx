import { createFileRoute } from '@tanstack/react-router'
import { RoomPage } from '@/pages/Room'

export const Route = createFileRoute('/room')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Room — Shutap' }] }),
  component: RoomPage,
})
