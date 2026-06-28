import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useServerFn } from '@tanstack/react-start'
import { getMirrorPortrait, type MirrorPortrait } from '@/lib/mirror.functions'
import { Header } from '@/components/Header'

const ACCENT = '#7F77DD'

function ArcChart({ series }: { series: MirrorPortrait['score_series'] }) {
  if (series.length < 2) return null
  const w = 560
  const h = 160
  const pad = 16
  const max = 999
  const step = (w - pad * 2) / Math.max(1, series.length - 1)
  const pts = series.map((p, i) => {
    const x = pad + i * step
    const y = pad + (1 - p.score / max) * (h - pad * 2)
    return [x, y] as const
  })
  const d = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="mg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity=".5" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${d} L ${pts[pts.length - 1][0]} ${h - pad} L ${pts[0][0]} ${h - pad} Z`}
        fill="url(#mg)"
      />
      <path d={d} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={ACCENT} />
      ))}
    </svg>
  )
}

export function MirrorPage() {
  const navigate = useNavigate()
  const fetchPortrait = useServerFn(getMirrorPortrait)
  const { data, isLoading } = useQuery({
    queryKey: ['mirror', 'me'],
    queryFn: () => fetchPortrait(),
  })

  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5' }}>
      <Header />
      <main style={{ maxWidth: 740, margin: '0 auto', padding: '36px 22px 80px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '.18em',
              color: ACCENT,
            }}
          >
            THE MIRROR ✦
          </span>
        </div>
        <h1
          style={{
            fontFamily: 'Newsreader, serif',
            fontStyle: 'italic',
            fontSize: 34,
            lineHeight: 1.18,
            margin: '0 0 10px',
            color: '#0b080f',
          }}
        >
          a living portrait of you, drawn from what you've actually said.
        </h1>

        {isLoading && (
          <p style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', color: '#6b4a5c' }}>
            gathering your memory…
          </p>
        )}

        {data?.forming && (
          <section
            style={{
              marginTop: 28,
              padding: 22,
              background: '#fff',
              border: '.5px solid rgba(11,8,15,.08)',
              borderRadius: 18,
            }}
          >
            <p
              style={{
                fontFamily: 'Newsreader, serif',
                fontStyle: 'italic',
                fontSize: 17,
                color: '#4a3040',
                margin: 0,
              }}
            >
              still forming. spill once or twice and i'll start to see you clearly.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: 14,
                background: ACCENT,
                color: '#fff',
                border: 0,
                borderRadius: 999,
                padding: '10px 18px',
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              spill or scan →
            </button>
          </section>
        )}

        {data && !data.forming && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                marginTop: 28,
              }}
            >
              {[
                ['spills', data.spill_count],
                ['scans', data.scan_count],
                ['trend', data.trend],
                ['pillar', data.top_pillar ?? '—'],
              ].map(([k, v]) => (
                <div
                  key={String(k)}
                  style={{
                    background: '#fff',
                    border: '.5px solid rgba(11,8,15,.08)',
                    borderRadius: 14,
                    padding: '14px 12px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: '.14em',
                      color: '#9e7a8c',
                      textTransform: 'uppercase',
                    }}
                  >
                    {String(k)}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Newsreader, serif',
                      fontStyle: 'italic',
                      fontSize: 22,
                      color: '#0b080f',
                      marginTop: 4,
                    }}
                  >
                    {String(v)}
                  </div>
                </div>
              ))}
            </div>

            {data.score_series.length >= 2 && (
              <section
                style={{
                  marginTop: 22,
                  background: '#fff',
                  border: '.5px solid rgba(11,8,15,.08)',
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '.14em',
                    color: ACCENT,
                    marginBottom: 8,
                  }}
                >
                  YOUR ARC
                </div>
                <ArcChart series={data.score_series} />
                <p
                  style={{
                    fontFamily: 'Newsreader, serif',
                    fontStyle: 'italic',
                    color: '#4a3040',
                    margin: '10px 0 0',
                  }}
                >
                  {data.trend === 'easing' && 'something has been easing in you lately.'}
                  {data.trend === 'rising' && "it's been getting louder. that's a real signal."}
                  {data.trend === 'steady' && "you've been holding steady — same weight, same shape."}
                  {data.trend === 'forming' && 'still forming.'}
                </p>
              </section>
            )}

            {data.recent_themes.length > 0 && (
              <section style={{ marginTop: 22 }}>
                <div
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '.14em',
                    color: '#9e7a8c',
                    marginBottom: 8,
                  }}
                >
                  WHAT KEEPS COMING UP
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.recent_themes.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: '#fff',
                        border: '.5px solid rgba(127,119,221,.3)',
                        color: ACCENT,
                        borderRadius: 999,
                        padding: '6px 12px',
                        fontFamily: 'Sora, sans-serif',
                        fontSize: 12,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section
              style={{
                marginTop: 28,
                padding: 22,
                background: 'linear-gradient(135deg, rgba(127,119,221,.10), rgba(231,84,138,.06))',
                border: '.5px solid rgba(127,119,221,.25)',
                borderRadius: 20,
              }}
            >
              <p
                style={{
                  fontFamily: 'Newsreader, serif',
                  fontStyle: 'italic',
                  fontSize: 17,
                  color: '#0b080f',
                  margin: '0 0 12px',
                }}
              >
                want the full reading — the cross-situation pattern, the things you only see when you zoom out?
              </p>
              <button
                onClick={() => navigate('/subscribe')}
                style={{
                  background: ACCENT,
                  color: '#fff',
                  border: 0,
                  borderRadius: 999,
                  padding: '11px 20px',
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                open the full mirror →
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
