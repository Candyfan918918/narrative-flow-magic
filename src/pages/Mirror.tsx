// The Mirror — reactive page. All values come from the user's mirror_patterns
// rows (or the read-only demo cast for logged-out previews). Opens issue
// zero model calls; the punch line is a DB field.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { Header } from '@/components/Header'
import { MirrorCard, type MirrorPatternView } from '@/components/mirror/MirrorCard'
import {
  listMirrorPatterns,
  listDemoPatterns,
} from '@/lib/mirror-pipeline.functions'
import { runMirrorCrossRead } from '@/lib/agents/mirror.functions'
import {
  DISTRICT_LABEL,
  DISTRICT_SIGIL,
  type District,
} from '@/lib/agents/mirror-guards'

const DISTRICTS: District[] = ['self', 'career', 'love', 'family', 'social']

function WorldBand({ patterns }: { patterns: MirrorPatternView[] }) {
  const totals = useMemo(() => {
    const acc: Record<District, number> = { self: 0, career: 0, love: 0, family: 0, social: 0 }
    for (const p of patterns) acc[p.district] = (acc[p.district] ?? 0) + p.count
    return acc
  }, [patterns])
  const max = Math.max(1, ...Object.values(totals))
  return (
    <section style={{
      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginTop: 22,
    }}>
      {DISTRICTS.map((d) => {
        const v = totals[d]
        const h = 12 + (v / max) * 60
        return (
          <div key={d} style={{
            background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '10px 8px',
            border: '.5px solid rgba(255,255,255,.06)', textAlign: 'center', color: '#fff',
          }}>
            <div style={{
              height: 72, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}>
              <div style={{
                width: 18, height: h, borderRadius: 4,
                background: v > 0 ? 'linear-gradient(180deg,#9b8cff,#5947d6)' : 'rgba(255,255,255,.06)',
              }} />
            </div>
            <div style={{
              marginTop: 6, fontFamily: 'Sora, sans-serif', fontSize: 10, letterSpacing: '.14em',
              color: 'rgba(255,255,255,.6)',
            }}>
              {DISTRICT_SIGIL[d]} {DISTRICT_LABEL[d].toUpperCase()}
            </div>
            <div style={{
              fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 16, color: '#fff',
            }}>
              {v}
            </div>
          </div>
        )
      })}
    </section>
  )
}

function CrossReadPanel({ patterns }: { patterns: MirrorPatternView[] }) {
  const cross = useServerFn(runMirrorCrossRead)
  const { data } = useQuery({
    queryKey: ['mirror-cross', patterns.map((p) => p.id).sort().join(',')],
    enabled: patterns.length >= 2,
    staleTime: 1000 * 60 * 60,
    queryFn: () =>
      cross({
        data: {
          patterns: patterns.slice(0, 12).map((p) => ({
            name: p.name, district: p.district, count: p.count, depth: p.depth, trend_dir: p.trend_dir,
          })),
        },
      }),
  })
  if (!data) return null
  return (
    <section style={{
      marginTop: 28, padding: 22, borderRadius: 20, color: '#fff',
      background: 'linear-gradient(135deg, rgba(127,119,221,.18), rgba(231,84,138,.10))',
      border: '.5px solid rgba(127,119,221,.3)',
    }}>
      <div style={{
        fontFamily: 'Sora, sans-serif', fontSize: 10, letterSpacing: '.22em',
        color: '#C8B6FF', marginBottom: 8,
      }}>
        THE CROSS-READ
      </div>
      <p style={{
        margin: '0 0 10px', fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 22,
        lineHeight: 1.25,
      }}>
        {data.sees}
      </p>
      <p style={{
        margin: 0, fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 17,
        lineHeight: 1.35, color: 'rgba(255,255,255,.85)',
      }}>
        {data.throughline}
      </p>
      <div style={{
        marginTop: 14, fontFamily: 'Sora, sans-serif', fontSize: 10, letterSpacing: '.22em',
        color: 'rgba(255,255,255,.5)', textTransform: 'uppercase',
      }}>
        {data.record}
      </div>
    </section>
  )
}

function Forming({ onSpill }: { onSpill: () => void }) {
  return (
    <section style={{
      marginTop: 26, padding: 26, borderRadius: 20,
      background: 'linear-gradient(160deg,#1a1825,#0c0a14)',
      border: '.5px solid rgba(255,255,255,.08)', color: '#fff',
    }}>
      <div style={{
        fontFamily: 'Sora, sans-serif', fontSize: 10, letterSpacing: '.22em',
        color: '#C8B6FF', marginBottom: 8,
      }}>
        STILL FORMING
      </div>
      <p style={{
        margin: '0 0 14px', fontFamily: 'Newsreader, serif', fontStyle: 'italic',
        fontSize: 22, lineHeight: 1.25,
      }}>
        the mirror begins the moment you spill or scan. nothing here yet — and nothing fabricated.
      </p>
      <button onClick={onSpill} style={{
        background: '#7F77DD', color: '#fff', border: 0, borderRadius: 999,
        padding: '11px 20px', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13,
        cursor: 'pointer',
      }}>
        spill or scan →
      </button>
    </section>
  )
}

export function MirrorPage() {
  const navigate = useNavigate()
  const fetchMine = useServerFn(listMirrorPatterns)
  const fetchDemo = useServerFn(listDemoPatterns)
  const { data: mine, isLoading } = useQuery({
    queryKey: ['mirror-patterns', 'me'],
    queryFn: () => fetchMine(),
  })
  const { data: demo } = useQuery({
    queryKey: ['mirror-patterns', 'demo-preview'],
    queryFn: () => fetchDemo(),
    enabled: !isLoading && (mine?.length ?? 0) < 2,
    staleTime: 1000 * 60 * 30,
  })
  const [showDemo, setShowDemo] = useState(false)

  // inject the orbit keyframe once
  useEffect(() => {
    if (document.getElementById('mirror-kf')) return
    const s = document.createElement('style')
    s.id = 'mirror-kf'
    s.textContent = `@keyframes mirror-orbit { to { transform: rotate(360deg); } }`
    document.head.appendChild(s)
  }, [])

  const mineList = (mine ?? []) as unknown as MirrorPatternView[]
  const demoList = (demo ?? []) as unknown as MirrorPatternView[]
  const isForming = mineList.length < 2
  const list = showDemo ? demoList : mineList

  return (
    <div style={{ minHeight: '100vh', background: '#07050d' }}>
      <Header />
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '36px 22px 80px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4,
        }}>
          <span style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 11,
            letterSpacing: '.22em', color: '#C8B6FF',
          }}>
            THE MIRROR ✦
          </span>
        </div>
        <h1 style={{
          fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontWeight: 500,
          fontSize: 34, lineHeight: 1.18, margin: '0 0 14px', color: '#fff',
        }}>
          a living portrait of you, drawn from what you've actually said and done.
        </h1>

        {isLoading && (
          <p style={{
            fontFamily: 'Newsreader, serif', fontStyle: 'italic', color: 'rgba(255,255,255,.55)',
          }}>
            gathering your memory…
          </p>
        )}

        {!isLoading && isForming && (
          <>
            <Forming onSpill={() => navigate('/')} />
            {demoList.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <button
                  onClick={() => setShowDemo((v) => !v)}
                  style={{
                    background: 'transparent', color: '#C8B6FF',
                    border: '.5px solid rgba(200,182,255,.4)', borderRadius: 999,
                    padding: '8px 16px', fontFamily: 'Sora, sans-serif', fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {showDemo ? 'hide example mirror' : 'see what your mirror becomes →'}
                </button>
                {showDemo && (
                  <div style={{
                    marginTop: 14, padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(200,182,255,.08)', color: '#C8B6FF',
                    fontFamily: 'Sora, sans-serif', fontSize: 11, letterSpacing: '.14em',
                  }}>
                    ILLUSTRATIVE — NOT YOUR DATA
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {(!isForming || (showDemo && demoList.length > 0)) && (
          <>
            <WorldBand patterns={list} />
            <div style={{
              display: 'grid', gap: 18, marginTop: 22,
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            }}>
              {list.map((p) => (
                <MirrorCard key={p.id} p={p} />
              ))}
            </div>
            {list.length >= 2 && <CrossReadPanel patterns={list} />}
          </>
        )}
      </main>
    </div>
  )
}
