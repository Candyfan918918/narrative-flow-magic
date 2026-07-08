import { useEffect, useRef } from 'react'

/** Magnetic pill effect — on fine pointers, the element translates toward
 * the cursor by `(offset from center) × strength` while hovered, and springs
 * back on leave. Disabled on touch / reduced-motion. */
export function useMagnetic<T extends HTMLElement = HTMLElement>(strength = 0.22) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined' || !window.matchMedia) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const origTransition = el.style.transition
    const origTransform = el.style.transform
    let raf = 0

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transition = 'transform 0s'
        el.style.transform = `translate(${(dx * strength).toFixed(2)}px, ${(dy * strength).toFixed(2)}px)`
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(raf)
      el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)'
      el.style.transform = origTransform || ''
    }
    el.addEventListener('pointerenter', onMove)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerenter', onMove)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.style.transform = origTransform
      el.style.transition = origTransition
    }
  }, [strength])

  return ref
}
