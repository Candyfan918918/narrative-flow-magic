/* Your cards, newest first.
 *
 * Each entry is the situation line plus the cards flipped from it, with the
 * slot label on every one — three takes and one roast should be legible as
 * such at a glance, because that shape is the point of keeping the list.
 *
 * Unflipped positions are not shown, at any tier. A card that was never
 * flipped was never written and does not exist: no ghost rows, no blurred
 * teasers, no "2 more". The free tier renders completely at its own depth. */
import { angleLabel, type JokeCard } from '@/lib/jokes/deck'
import { Eyebrow, INK, MUTED, NEWS, SORA } from './ui'

export type SetGroup = { id: string; situation: string; cards: JokeCard[] }

export function SetList({ groups }: { groups: SetGroup[] }) {
  if (!groups.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groups.map((group) => (
        <div
          key={group.id}
          style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            background: '#fff', border: '1px solid rgba(11,8,15,.08)',
            borderRadius: 22, padding: 18,
          }}
        >
          <span style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 15, lineHeight: 1.45, color: MUTED, textWrap: 'pretty' }}>
            {group.situation}
          </span>
          {group.cards.map((card) => (
            <div
              key={card.id ?? `${group.id}-${card.position}`}
              style={{
                display: 'flex', flexDirection: 'column', gap: 5,
                paddingTop: 10, borderTop: '1px solid rgba(11,8,15,.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Eyebrow style={{ fontSize: 11, letterSpacing: '.14em', color: MUTED, fontFamily: SORA }}>
                  {card.angleLabel || angleLabel(card.angle)}
                </Eyebrow>
                {card.room_id ? <Eyebrow style={{ fontSize: 9, color: '#8e1c4c' }}>◎ in a room</Eyebrow> : null}
              </div>
              <span style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 17, lineHeight: 1.35, color: INK, textWrap: 'pretty' }}>
                {card.text}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
