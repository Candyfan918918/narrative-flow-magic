import { createFileRoute } from '@tanstack/react-router'
import { SpaShell } from '@/components/SpaShell'

export const Route = createFileRoute('/$')({
  ssr: false,
  component: SpaShell,
})
