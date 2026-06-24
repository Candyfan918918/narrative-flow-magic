import { useNavigate } from 'react-router-dom'
import { ScaffoldShell, Eyebrow, Title, Lead } from '../components/ScaffoldShell'
import { SHUTAP_SEED } from '../data/seed'
import type { HofEntry } from '../data/types'

const HALLS: { key: string; label: string }[] = [
  { key: 'loving', label: 'Most Loving' },
  { key: 'brave', label: 'Bravest' },
  { key: 'healing', label: 'Most Healing' },
  { key: 'relatable', label: 'Most Relatable' },
  { key: 'hardwon', label: 'Hardest-Won' },
  { key: 'funny', label: 'Funniest' },
]

const bandColor: Record<string, string> = {
  legend: '#c1216b',
  honored: '#c87c4a',
  held: '#5b8a5e',
}

/* Hall of Fame — "rooms the world remembered." Reads the seed-derived halls and
   links each honored entry through to its real room in the Stream. */
export function HallOfFamePage() {
  const navigate = useNavigate()
  const hof = SHUTAP_SEED.hof || {}

  return (
    <ScaffoldShell>
      <Eyebrow>rooms the world remembered</Eyebrow>
      <Title>the halls.</Title>
      <Lead>the rooms that resonated most — held, honored, legend. tap any one to sit in it.</Lead>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
        {HALLS.map(({ key, label }) => {
          const entries = (hof[key] || []).slice(0, 6)
          if (!entries.length) return null
          return (
            <section key={key}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 17, color: '#0b080f', margin: 0, letterSpacing: '-.01em' }}>{label}</h2>
                <span style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 13, color: '#9e7a8c' }}>this week</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {entries.map((e: HofEntry, i) => (
                  <div
                    key={i}
                    className="rtile"
                    onClick={() => e.id && navigate('/stream#room-' + e.id)}
                    style={{ borderRadius: 16, cursor: e.id ? 'pointer' : 'default' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px' }}>
                      <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 15, color: '#9e7a8c', width: 20, flex: 'none' }}>{e.rank}</span>
                      <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#f7e8f0', display: 'grid', placeItems: 'center', fontSize: 16, flex: 'none' }}>{e.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 13.5, lineHeight: 1.3, color: '#0b080f', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {e.title}
                        </div>
                        <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 12, color: '#9e7a8c', marginTop: 3 }}>{e.alias}</div>
                      </div>
                      <div style={{ textAlign: 'right', flex: 'none' }}>
                        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 15, color: '#c1216b' }}>{e.resonance}</div>
                        {e.band && (
                          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: bandColor[e.band] || '#9e7a8c', marginTop: 2 }}>
                            {e.band}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </ScaffoldShell>
  )
}
