import { useEffect, useState } from 'react'

/** Wraps `(prefers-reduced-motion: reduce)`. SSR-safe: returns false on the
 * server / first render, updates after mount. Consumers must fully disable
 * decorative motion (no observers, no wrappers) when this returns true. */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduce(mq.matches)
    on()
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduce
}
