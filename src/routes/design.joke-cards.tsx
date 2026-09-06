import { createFileRoute } from '@tanstack/react-router'
import { JokeCardsDesign } from '@/pages/home/joke/JokeCardsDesign'

// The joke-card surface, annotated: a live deck plus every state held still.
// A design reference, not a product page — kept out of the index.
export const Route = createFileRoute('/design/joke-cards')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Joke cards, annotated — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: JokeCardsDesign,
})
