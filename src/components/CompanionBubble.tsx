import { useEffect, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { EyeMark } from './EyeMark'
import { getDueCheckin } from '@/lib/checkins.functions'
import { supabase } from '@/integrations/supabase/client'

/* The companion: a draggable, semi-transparent pink circle with the brand eyes
   (no pill, no label). Tap (without dragging) opens the Ask flow; drag to
   reposition (persisted to localStorage). */
export function CompanionBubble({
  onOpen,
  elevated = false,
}: {
  onOpen: () => void
  elevated?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onOpenRef = useRef(onOpen)
  useEffect(() => { onOpenRef.current = onOpen }, [onOpen])
  const fetchDue = useServerFn(getDueCheckin)
  const [hasDue, setHasDue] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: sess } = await supabase.auth.getSession()
        const u = sess.session?.user as { is_anonymous?: boolean } | undefined
        const real = !!sess.session && !u?.is_anonymous
        if (!real) return
        const d = await fetchDue()
        if (!cancelled && d) setHasDue(true)
      } catch { /* fail silent */ }
    })()
    return () => { cancelled = true }
  }, [fetchDue])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let dragging = false
    let moved = false
    let sx = 0
    let sy = 0
    let ox = 0
    let oy = 0
    const TAP_THRESHOLD = 10

    const down = (e: PointerEvent) => {
      dragging = true
      moved = false
      const r = el.getBoundingClientRect()
      ox = r.left
      oy = r.top
      sx = e.clientX
      sy = e.clientY
      el.style.cursor = 'grabbing'
      if (el.setPointerCapture && e.pointerId != null) el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - sx
      const dy = e.clientY - sy
      if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) moved = true
      if (!moved) return
      const sz = el.offsetWidth
      const nx = Math.max(8, Math.min(window.innerWidth - sz - 8, ox + dx))
      const ny = Math.max(8, Math.min(window.innerHeight - sz - 8, oy + dy))
      el.style.left = nx + 'px'
      el.style.top = ny + 'px'
      el.style.bottom = 'auto'
      e.preventDefault()
    }
    const up = () => {
      if (!dragging) return
      dragging = false
      el.style.cursor = 'grab'
      if (!moved) {
        // tap: no meaningful movement — fire onOpen
        try { onOpenRef.current() } catch { /* noop */ }
      }
    }

    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label="Ask the companion"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      style={{
        position: 'fixed',
        left: 'calc(50% - 29px)',
        bottom: 24,
        zIndex: elevated ? 65 : 35,
        width: 58,
        height: 58,
        borderRadius: '50%',
        background: 'rgba(231,84,138,0.18)',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 12px 30px -8px rgba(60,10,30,.35)',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pulse 4s infinite',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ pointerEvents: 'none', display: 'inline-flex', transform: 'translateX(-2px)' }}>
        <EyeMark size={34} />
      </div>
      {hasDue && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#e7548a',
            boxShadow: '0 0 0 2px rgba(46,13,26,.9)',
            animation: 'pulse 2.4s infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

