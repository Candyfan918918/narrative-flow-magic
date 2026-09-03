import { createFileRoute } from '@tanstack/react-router'
import { EXAMPLE_PATTERNS, TarotCard, MiniCard } from '@/pages/Mirror'
import { MirrorCard } from '@/components/mirror/MirrorCard'
export const Route = createFileRoute('/tmpmirrorcheck')({
  ssr: false,
  component: () => (
    <div style={{ background: 'var(--bg)', padding: 24, display: 'grid', gap: 20, gridTemplateColumns: '440px 340px 240px' }}>
      <TarotCard p={EXAMPLE_PATTERNS[1]} animate={false} />
      <MirrorCard p={EXAMPLE_PATTERNS[0] as never} />
      <div style={{ display: 'grid', gap: 12 }}>
        <MiniCard p={EXAMPLE_PATTERNS[0]} onOpen={() => {}} />
        <MiniCard p={EXAMPLE_PATTERNS[14]} onOpen={() => {}} />
      </div>
    </div>
  ),
})
