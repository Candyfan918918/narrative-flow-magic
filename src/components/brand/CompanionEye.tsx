/* Cursor-reactive companion eye. A single module-level RAF loop drives
   every mounted instance — pointer tracking, spring tilt, breathing, and
   periodic lunge — with drop-shadow that intensifies on lunge. Reduced-
   motion viewers see a still eye, no blink. */
import { useEffect, useId, useRef } from 'react'

type Tracked = {
  el: HTMLDivElement
  cx: number
  cy: number
  sRX: number
  sRY: number
  vRX: number
  vRY: number
}

const tracked = new Set<Tracked>()
let raf = 0
let pointer = { x: -1, y: -1 }
let t0 = 0

function ensureLoop() {
  if (raf || typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  t0 = performance.now()
  const onMove = (e: PointerEvent) => { pointer.x = e.clientX; pointer.y = e.clientY }
  window.addEventListener('pointermove', onMove)
  ;(ensureLoop as unknown as { _off?: () => void })._off = () => window.removeEventListener('pointermove', onMove)

  const tick = () => {
    const now = performance.now()
    const t = (now - t0) / 1000
    const breathe = 1 + 0.035 * Math.sin(t * 1.1)
    const lunge = Math.pow(Math.max(0, Math.sin(t * 0.30)), 8) * 0.06
    tracked.forEach(item => {
      const r = item.el.getBoundingClientRect()
      const ecx = r.left + r.width / 2
      const ecy = r.top + r.height / 2
      let dx = 0, dy = 0
      if (pointer.x >= 0) {
        dx = Math.max(-1, Math.min(1, (pointer.x - ecx) / (window.innerWidth / 2)))
        dy = Math.max(-1, Math.min(1, (pointer.y - ecy) / (window.innerHeight / 2)))
      }
      const targetRX = -dy * 12
      const targetRY = dx * 16
      item.vRX += (targetRX - item.sRX) * 0.06
      item.vRY += (targetRY - item.sRY) * 0.06
      item.vRX *= 0.86
      item.vRY *= 0.86
      item.sRX += item.vRX
      item.sRY += item.vRY
      const spin = Math.abs(item.vRX) + Math.abs(item.vRY)
      const scale = breathe + lunge
      const tz = spin * 14 + lunge * 130
      item.el.style.transform =
        `perspective(650px) rotateX(${item.sRX}deg) rotateY(${item.sRY}deg) translateZ(${tz}px) scale(${scale})`
      item.el.style.filter =
        `drop-shadow(0 ${18 + lunge * 70}px ${34 + lunge * 60}px rgba(193,33,107,${0.30 + lunge * 0.35}))`
      const pupilShift = item.el.querySelector<SVGGElement>('[data-pupils]')
      if (pupilShift) pupilShift.setAttribute('transform', `translate(${dx * 9} ${dy * 7})`)
    })
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

function stopLoopIfEmpty() {
  if (tracked.size > 0 || !raf) return
  cancelAnimationFrame(raf)
  raf = 0
  ;(ensureLoop as unknown as { _off?: () => void })._off?.()
}

export function CompanionEye({ size = 96, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const eg = `ce-eye-${rid}`
  const pg = `ce-pup-${rid}`

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const item: Tracked = { el, cx: 0, cy: 0, sRX: 0, sRY: 0, vRX: 0, vRY: 0 }
    tracked.add(item)
    ensureLoop()
    return () => {
      tracked.delete(item)
      stopLoopIfEmpty()
    }
  }, [])

  const height = (size * 96) / 140
  return (
    <span
      className={className}
      style={{ display: 'inline-block', width: size, height, lineHeight: 0, ...style }}
    >
      <div
        ref={wrapRef}
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          willChange: 'transform, filter',
          filter: 'drop-shadow(0 18px 34px rgba(193,33,107,.30))',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '100%',
            height: '100%',
            transformOrigin: 'center',
            animation: 'ce-blink 4.6s ease-in-out infinite',
          }}
        >
          <svg viewBox="0 0 140 96" width="100%" height="100%" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <radialGradient id={eg} cx="40%" cy="16%" r="80%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="18%" stopColor="#ffd0e8" />
                <stop offset="48%" stopColor="#f060a0" />
                <stop offset="100%" stopColor="#c1216b" />
              </radialGradient>
              <radialGradient id={pg} cx="50%" cy="42%" r="72%">
                <stop offset="0%" stopColor="#3a1020" />
                <stop offset="100%" stopColor="#060106" />
              </radialGradient>
            </defs>
            <rect x="16" y="6" width="56" height="84" rx="28" fill={`url(#${eg})`} />
            <rect x="84" y="6" width="56" height="84" rx="28" fill={`url(#${eg})`} />
            <g data-pupils>
              <ellipse cx="44" cy="62" rx="19" ry="24" fill={`url(#${pg})`} />
              <ellipse cx="112" cy="62" rx="19" ry="24" fill={`url(#${pg})`} />
            </g>
            <path d="M44 22 C41 18 35 18 35 24 C35 30 44 36 44 36 C44 36 53 30 53 24 C53 18 47 18 44 22Z" fill="#fff" opacity=".95" />
            <path d="M112 22 C109 18 103 18 103 24 C103 30 112 36 112 36 C112 36 121 30 121 24 C121 18 115 18 112 22Z" fill="#fff" opacity=".95" />
          </svg>
        </span>
      </div>
      <style>{`@keyframes ce-blink{0%,34%,40%,78%,84%,100%{transform:scaleY(1)}37%,81%{transform:scaleY(.08)}}
@media (prefers-reduced-motion: reduce){span[style*="ce-blink"]{animation:none!important}}`}</style>
    </span>
  )
}
