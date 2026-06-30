import { useEffect, useRef } from 'react'

/* The companion: a draggable, semi-transparent pink circle with the brand eyes
   (no pill, no label) — exactly as the user landed on it. Tap (without dragging)
   opens the Ask flow; drag to reposition (persisted to localStorage). */
export function CompanionBubble({
  onOpen,
  elevated = false,
}: {
  onOpen: () => void
  elevated?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const draggedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // restore saved position
    try {
      const p = JSON.parse(localStorage.getItem('shutap_bubble') || 'null')
      if (p) {
        el.style.left = p.x + 'px'
        el.style.top = p.y + 'px'
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
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true
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
        draggedRef.current = true
        setTimeout(() => (draggedRef.current = false), 50)
        const r = el.getBoundingClientRect()
        try {
          localStorage.setItem('shutap_bubble', JSON.stringify({ x: r.left, y: r.top }))
        } catch {
          /* noop */
        }
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
      onClick={() => {
        if (draggedRef.current) return
        onOpen()
      }}
      role="button"
      tabIndex={0}
      aria-label="Ask the companion"
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
      <svg
        viewBox="0 0 56 56"
        fill="none"
        style={{ width: 32, height: 32, display: 'block', pointerEvents: 'none' }}
      >
        <rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)" />
        <rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)" />
        <ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG)" />
        <ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG)" />
      </svg>
    </div>
  )
}
