/* One joke card, as it looks on screen.
 *
 * This is the same composition the export renders, at the same 9:16 — so what
 * someone saves is what they were just looking at, the mark included. Sizes
 * are container-query units against the card's own width, which is what keeps
 * the deck, the export preview and a phone-width column all in proportion. */
import type { JokeCard } from '@/lib/jokes/deck'
import { angleAccent } from '@/lib/jokes/deck'
import { Eyes } from './ui'

export function CardFace({
  card,
  situation,
  mark,
  loading,
}: {
  card: JokeCard
  situation: string
  mark: boolean
  loading: boolean
}) {
  const accent = angleAccent(card.angle)
  return (
    <div
      style={{
        position: 'relative', containerType: 'inline-size', width: '100%', aspectRatio: '9/16',
        maxHeight: '62vh', margin: '0 auto', borderRadius: 26, overflow: 'hidden',
        background: 'radial-gradient(135% 78% at 50% 0%,#3a1022,#1a0a12 60%,#120710)',
        border: '.5px solid rgba(255,255,255,.16)',
        boxShadow: '0 22px 50px -24px rgba(0,0,0,.7)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '7cqw 6.5cqw', color: '#f7e8f0',
      }}
    >
      <div style={{ position: 'absolute', width: '150%', height: '44%', left: '-25%', top: '14%', background: `radial-gradient(circle,${accent}4d,transparent 66%)`, filter: 'blur(4px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '-20%', opacity: 0.06, backgroundImage: 'radial-gradient(rgba(255,255,255,.8) .5px,transparent .5px)', backgroundSize: '4px 4px', pointerEvents: 'none' }} />

      {mark ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '9cqw', transform: 'rotate(-22deg)', pointerEvents: 'none', opacity: 0.085 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ font: '800 13cqw/1 Sora,sans-serif', letterSpacing: '-.04em', whiteSpace: 'nowrap', color: '#fff', textAlign: 'center' }}>
              shutap · shutap
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4cqw' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.4cqw' }}>
          <Eyes size={20} accent={accent} />
          <span style={{ font: '800 7cqw/1 Sora,sans-serif', letterSpacing: '-.04em', color: '#f7e8f0' }}>
            shut<span style={{ color: '#e7548a' }}>ap</span>
          </span>
        </div>
        <span style={{ font: '800 4.2cqw/1 Sora,sans-serif', letterSpacing: '.28em', textTransform: 'uppercase', color: accent }}>
          {card.angleLabel}
        </span>
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4cqw' }}>
        <div style={{ font: '400 4.4cqw/1.45 Inter,sans-serif', color: '#9b8090', maxWidth: '26ch' }}>
          {situation}
        </div>
        <div style={{ font: 'italic 400 8cqw/1.32 Newsreader,serif', letterSpacing: '-.01em', color: '#f7e8f0', textWrap: 'pretty', opacity: loading ? 0.35 : 1, transition: 'opacity .25s' }}>
          {loading ? 'shuffling…' : card.text}
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '3cqw' }}>
        <span style={{ font: 'italic 400 4.4cqw/1 Newsreader,serif', color: '#9b8090' }}>said it on shutap.com</span>
        {mark ? (
          <span style={{ font: '700 3.6cqw/1 Inter,sans-serif', letterSpacing: '.06em', color: 'rgba(247,232,240,.55)', border: '.5px solid rgba(255,255,255,.18)', borderRadius: 999, padding: '1.4cqw 3cqw', whiteSpace: 'nowrap' }}>
            made on shutap
          </span>
        ) : null}
      </div>
    </div>
  )
}
