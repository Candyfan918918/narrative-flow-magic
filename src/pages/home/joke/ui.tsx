/* Shared chrome for the joke-card flow.
 *
 * Everything is inline-styled on purpose: this surface renders inside two
 * different page shells (`/` and `/mirror`), neither of which ships the button
 * classes, so the flow carries its own. */
import type { CSSProperties, ReactNode } from 'react'
import { EyeMark, ShutapWordmark } from '@/components/brand/EyeMark'

export const SORA = "'Sora',system-ui,sans-serif"
export const NEWS = "'Newsreader',Georgia,serif"
export const INTER = "'Inter',system-ui,sans-serif"

export const INK = '#0b080f'
export const PROSE = '#2e1a26'
export const MUTED = '#6b4a5c'
export const FAINT = '#9e7a8c'
export const ACCENT = '#c1216b'
export const ACCENT_SOFT = '#e7548a'
export const VIOLET = '#7F77DD'
export const DARK = '#100c14'

/* ─────────────────────── the card's own world ───────────────────────
   Both sides of a card are painted from these, so a flip reads as one object
   turning over rather than as two different cards. Sizes inside a card are
   container-query units against the card's own width — that is what keeps the
   deck, the export preview and a phone-width column all in proportion. */

export const CARD_GROUND = 'radial-gradient(135% 78% at 50% 0%,#3a1022,#1a0a12 60%,#120710)'
export const CARD_EDGE = '.5px solid rgba(255,255,255,.16)'
export const CARD_SHADOW = '0 22px 50px -24px rgba(0,0,0,.7)'
export const CARD_SHADOW_HOVER = '0 30px 60px -26px rgba(0,0,0,.78)'
export const CARD_INK = '#f7e8f0'
export const CARD_INK_2 = 'rgba(247,232,240,.72)'
export const CARD_FAINT = '#9b8090'

/** The dot grain both sides carry. Absolute, so it sits under the type. */
export const CARD_GRAIN: CSSProperties = {
  position: 'absolute',
  inset: 0,
  opacity: 0.06,
  backgroundImage: 'radial-gradient(rgba(255,255,255,.9) .5px,transparent .5px)',
  backgroundSize: '4px 4px',
  pointerEvents: 'none',
}

/** The accent trio are light-surface inks. On the card's ground a small
 *  uppercase label in the raw accent misses 4.5:1 — the clapback lands at
 *  3.2:1 — so lift it toward white before painting. */
export function lift(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1]!, 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(v + (255 - v) * amount),
  )
  return `rgb(${ch.join(',')})`
}

/** Eyes + wordmark, sized off the card's width so the lockup's proportions
 *  hold at any card size — deck thumbnail, full column, or export preview. */
export function CardLockup() {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '2.4cqw' }}>
      <EyeMark style={{ width: '6.4cqw', height: '4.39cqw' }} />
      <ShutapWordmark ink={CARD_INK} style={{ fontSize: '7cqw', letterSpacing: '-.04em' }} />
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  full,
  size = 'md',
  style,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'locked'
  disabled?: boolean
  full?: boolean
  size?: 'sm' | 'md'
  style?: CSSProperties
  title?: string
}) {
  const height = size === 'sm' ? 36 : 44
  const palette: Record<string, CSSProperties> = {
    primary: {
      background: 'linear-gradient(155deg,#e7548a,#c1216b 55%,#890041)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 14px 30px -18px rgba(137,0,65,.75)',
    },
    secondary: {
      background: '#fff',
      color: INK,
      border: '1.5px solid rgba(11,8,15,.14)',
    },
    ghost: {
      background: 'transparent',
      color: MUTED,
      border: 'none',
    },
    locked: {
      background: 'rgba(11,8,15,.04)',
      color: FAINT,
      border: '1px dashed rgba(11,8,15,.16)',
    },
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        height,
        width: full ? '100%' : undefined,
        padding: size === 'sm' ? '0 16px' : '0 22px',
        borderRadius: 999,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: SORA,
        fontWeight: 700,
        fontSize: size === 'sm' ? 13 : 14.5,
        letterSpacing: '-.01em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.6 : 1,
        transition: 'transform .16s ease, opacity .16s ease',
        ...palette[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: SORA,
        fontWeight: 800,
        fontSize: 11,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        color: FAINT,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** The eyes. The companion's whole face, and the only mascot on this surface. */
export function Eyes({ size = 26, accent = ACCENT_SOFT }: { size?: number; accent?: string }) {
  const w = size * 0.48
  const gap = size * 0.12
  return (
    <span
      aria-hidden
      style={{ display: 'inline-flex', alignItems: 'center', gap, flex: 'none', height: size }}
    >
      {[0, 1].map((i) => (
        <span
          key={i}
          style={{
            position: 'relative',
            width: w,
            height: size,
            borderRadius: w,
            background: accent,
            display: 'block',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: '54%',
              transform: 'translate(-50%,-50%)',
              width: w * 0.7,
              height: size * 0.42,
              borderRadius: '50%',
              background: '#120710',
            }}
          />
        </span>
      ))}
    </span>
  )
}

/** A bottom sheet. Never a route change — the cards stay where they are. */
export function Sheet({
  open,
  onClose,
  children,
  width = 460,
  tone = 'light',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: number
  tone?: 'light' | 'dark'
}) {
  if (!open) return null
  const dark = tone === 'dark'
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(11,8,15,.55)', backdropFilter: 'blur(5px)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: `min(${width}px,100%)`,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: dark ? 'linear-gradient(160deg,#241019,#100c14)' : '#fff',
          border: dark ? '.5px solid rgba(255,255,255,.12)' : 'none',
          borderRadius: '24px 24px 0 0',
          padding: '22px 20px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          animation: 'shutapSheetIn .34s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 4,
            borderRadius: 99,
            background: dark ? 'rgba(255,255,255,.18)' : 'rgba(11,8,15,.12)',
            margin: '0 auto 4px',
            flex: 'none',
          }}
        />
        {children}
      </div>
      <style>{`@keyframes shutapSheetIn{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  )
}

/** The companion speaking. Eyes on the left, the line in the voice. */
export function CompanionLine({
  children,
  size = 26,
  tone = 'light',
}: {
  children: ReactNode
  size?: number
  tone?: 'light' | 'dark'
}) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
      <span style={{ paddingTop: 3 }}>
        <Eyes size={size} />
      </span>
      <div
        style={{
          flex: 1,
          fontFamily: NEWS,
          fontStyle: 'italic',
          fontSize: 17,
          lineHeight: 1.5,
          color: tone === 'dark' ? '#f7e8f0' : PROSE,
          textWrap: 'pretty',
        }}
      >
        {children}
      </div>
    </div>
  )
}
