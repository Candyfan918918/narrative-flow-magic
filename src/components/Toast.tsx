import { useCallback, useRef, useState } from 'react'

/* Toast pill. The hidden state translates a fixed 300px off-screen (not a %)
   — the prototype's permanent fix for the empty-pill-over-the-bubble bug. */
export function useToast() {
  const [msg, setMsg] = useState('')
  const [shown, setShown] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toast = useCallback((m: string) => {
    setMsg(m)
    setShown(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setShown(false), 4000)
  }, [])

  const ToastHost = (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 90,
        transform: shown ? 'translate(-50%,0)' : 'translate(-50%,300px)',
        zIndex: 92,
        background: '#fff',
        border: '.5px solid rgba(11,8,15,.10)',
        borderRadius: 999,
        padding: '11px 18px',
        color: '#0b080f',
        fontFamily: "'Newsreader',serif",
        fontStyle: 'italic',
        fontSize: 14,
        boxShadow: '0 20px 44px -20px rgba(60,10,30,.35)',
        transition: 'transform .4s cubic-bezier(.2,.7,.2,1)',
        maxWidth: '92vw',
      }}
    >
      {msg}
    </div>
  )

  return { toast, ToastHost }
}
