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

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // restore saved position (clamped to current viewport so a stale
    // localStorage entry from a larger window can't strand the bubble off-screen)
    try {
      const p = JSON.parse(localStorage.getItem('shutap_bubble') || 'null')
      if (p && typeof p.x === 'number' && typeof p.y === 'number') {
        const sz = el.offsetWidth || 58
        const nx = Math.max(8, Math.min(window.innerWidth - sz - 8, p.x))
        const ny = Math.max(8, Math.min(window.innerHeight - sz - 8, p.y))
        el.style.left = nx + 'px'
        el.style.top = ny + 'px'
        el.style.bottom = 'auto'
      }
    } catch {
      /* noop */
    }

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
      el.style.animation = 'none'
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
      if (moved) {
        const r = el.getBoundingClientRect()
        try {
          localStorage.setItem('shutap_bubble', JSON.stringify({ x: r.left, y: r.top }))
        } catch {
          /* noop */
        }
      } else {
        // tap: no meaningful movement — fire onOpen
        try { onOpenRef.current() } catch { /* noop */ }
      }
    }

    const onResize = () => {
      const sz = el.offsetWidth || 58
      const r = el.getBoundingClientRect()
      const nx = Math.max(8, Math.min(window.innerWidth - sz - 8, r.left))
      const ny = Math.max(8, Math.min(window.innerHeight - sz - 8, r.top))
      el.style.left = nx + 'px'
      el.style.top = ny + 'px'
      el.style.bottom = 'auto'
    }

    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('resize', onResize)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('resize', onResize)
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
    </div>
  )
}

