// Rooms strip — pulls the same seed rooms + user-published rooms the
// Stream page uses (that is the app's current live rooms source). No
// hardcoded titles; the empty state is honest.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { SHUTAP_SEED } from '@/data/seed'
import type { Room } from '@/data/types'
import { usePrefersReducedMotion } from './hero/Mascot'
import { useReactiveCard } from '@/components/motion'

const SORA = "'Sora',system-ui,sans-serif"
const NEWS = "'Newsreader',Georgia,serif"

type Card = {
  id: string
  alias: string
  emoji: string
  hours: string
  title: string
  sitting: number
  relates: number
}

function loadUserRooms(): Card[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('shutap_user_situations')
    if (!raw) return []
    const arr = JSON.parse(raw) as Array<Partial<Room> & { id: string }>
    return arr
      .filter((r) => r && r.id)
      .map((r) => ({
        id: r.id,
        alias: r.alias || 'someone',
        emoji: r.emoji || '🩷',
        hours: r.hours || 'just now',
        title: r.title || 'untitled',
        sitting: r.sitting ?? 1,
        relates: r.relates ?? 0,
      }))
  } catch {
    return []
  }
}

export function RoomsStrip() {
  const [user, setUser] = useState<Card[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)
  const reduce = usePrefersReducedMotion()
  const [dragging, setDragging] = useState(false)
  const draggingRef = useRef(false)

  useEffect(() => {
    setUser(loadUserRooms())
    const on = (e: StorageEvent) => {
      if (e.key === 'shutap_user_situations') setUser(loadUserRooms())
    }
    window.addEventListener('storage', on)
    return () => window.removeEventListener('storage', on)
  }, [])

  const cards = useMemo<Card[]>(() => {
    const seed = (SHUTAP_SEED.rooms || []).slice(0, 8).map((r) => ({
      id: r.id,
      alias: r.alias || 'someone',
      emoji: r.emoji || '🩷',
      hours: r.hours || '',
      title: r.title || 'untitled',
      sitting: r.sitting ?? 0,
      relates: r.relates ?? 0,
    }))
    return [...user, ...seed].slice(0, 8)
  }, [user])

  // Drag-to-scroll (suppresses accidental clicks after drag)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let startX = 0, startScroll = 0, active = false, moved = false
    const down = (e: PointerEvent) => {
      active = true; moved = false
      startX = e.clientX; startScroll = el.scrollLeft
      draggingRef.current = true
      setDragging(true)
    }
    const move = (e: PointerEvent) => {
      if (!active) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 4) moved = true
      el.scrollLeft = startScroll - dx
    }
    const up = () => {
      active = false
      draggingRef.current = false
      setDragging(false)
      if (moved) {
        // suppress next click
        const stop = (ev: MouseEvent) => { ev.preventDefault(); ev.stopPropagation(); el.removeEventListener('click', stop, true) }
        el.addEventListener('click', stop, true)
      }
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  const doubled = useMemo(() => (cards.length > 0 ? [...cards, ...cards] : []), [cards])

  return (
    <section style={{ background: '#fdf0f5', padding: '80px 0 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 22px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
        <h2 style={{ fontFamily: SORA, fontWeight: 800, fontSize: 'clamp(24px,3vw,36px)', letterSpacing: '-.03em', margin: 0 }}>
          rooms open <em style={{ fontFamily: NEWS, fontStyle: 'italic', color: '#c1216b', fontWeight: 400 }}>right now.</em>
        </h2>
        <Link to="/stream" style={{ fontFamily: NEWS, fontStyle: 'italic', color: '#c1216b', textDecoration: 'none', fontSize: 15 }}>
          all rooms →
        </Link>
      </div>

      {cards.length === 0 ? (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 22px' }}>
          <p style={{ fontFamily: NEWS, fontStyle: 'italic', color: '#9e7a8c', fontSize: 15 }}>rooms are forming.</p>
        </div>
      ) : (
        <div
          ref={wrapRef}
          className={`home-strip-wrap${dragging ? ' dragging' : ''}`}
          style={{ overflowX: 'auto', overflowY: 'hidden', cursor: dragging ? 'grabbing' : 'grab', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          <div className={reduce ? '' : 'home-strip-track'} style={{ display: 'inline-flex', gap: 16, padding: '4px 22px' }}>
            {(reduce ? cards : doubled).map((c, i) => (
              <RoomCard key={`${c.id}-${i}`} card={c} isDragging={() => draggingRef.current} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function RoomCard({ card: c, isDragging }: { card: Card; isDragging: () => boolean }) {
  const rc = useReactiveCard({ glow: 'rgba(231,84,138,.55)', isDisabled: isDragging })
  return (
    <div
      ref={rc.ref}
      style={{
        position: 'relative',
        width: 340,
        flex: 'none',
        borderRadius: 18,
        boxShadow: '0 10px 28px -22px rgba(60,10,30,.28)',
      }}
    >
      <Link
        to="/stream"
        hash={`room-${c.id}`}
        style={{
          display: 'block',
          width: '100%',
          background: '#fff',
          borderRadius: 18,
          padding: 18,
          textDecoration: 'none',
          color: '#0b080f',
          border: '.5px solid rgba(11,8,15,.06)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#f7e8f0,#f060a0)', fontSize: 18 }}>{c.emoji}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 13, color: '#4a3040' }}>{c.alias}</span>
            <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#9e7a8c' }}>{c.hours}</span>
          </div>
        </div>
        <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 15, lineHeight: 1.35, color: '#0b080f', marginBottom: 14, minHeight: 60, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {c.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: SORA, fontWeight: 600, fontSize: 11.5, color: '#6b4a5c' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="home-livedot green" style={{ width: 6, height: 6 }} />
            {c.sitting} sitting in
          </span>
          <span>🫂 {c.relates} relate</span>
          <span style={{ color: '#c1216b', fontFamily: NEWS, fontStyle: 'italic' }}>enter →</span>
        </div>
      </Link>
      {rc.decor}
    </div>
  )
}
