import React, { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useReducedMotion } from './useReducedMotion'
import './motion.css'

type Fx = 'swipe-l' | 'swipe-r' | 'zoom' | 'pop'

type RevealProps = {
  children: ReactNode
  fx?: Fx
  as?: keyof React.JSX.IntrinsicElements
  className?: string
  style?: CSSProperties
}

/** Block reveal. Wraps children in a single element (default <div>). Pure
 * pass-through — does not swallow clicks or focus. Replays every time the
 * element scrolls back into view. */
export function Reveal({ children, fx, as, className, style }: RevealProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const [inView, setInView] = useState(false)
  const Tag = (as || 'div') as keyof React.JSX.IntrinsicElements

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        setInView(!!e && e.isIntersecting)
      },
      { threshold: 0.18 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduce])

  if (reduce) {
    return React.createElement(Tag, { className, style, ref }, children)
  }

  const fxClass = 'mo-fx-' + (fx || 'default')
  const stateClass = !mounted
    ? 'mo-reveal-idle'
    : (inView ? 'mo-reveal-in' : 'mo-reveal-hidden')
  const cls = ['mo-reveal', fxClass, stateClass, className].filter(Boolean).join(' ')

  return React.createElement(Tag, { className: cls, style, ref }, children)
}
