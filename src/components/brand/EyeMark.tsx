// Canonical Shutap brand mark. ONE source for every eye/logo in the app.
// - Transparent background (never draw a background rect behind it).
// - Heart-shaped white glint on each capsule (approved brand icon).
// - Self-contained gradient defs with useId-scoped IDs so multiple
//   instances on the same page never collide.
// - Always blinks: the `.shutap-blink` class in global.css runs a scaleY
//   squeeze wrapped in `@media (prefers-reduced-motion: no-preference)`.
import React from 'react'

export type EyeMarkProps = {
  /** Rendered width in px; height derived from 140:96 viewBox aspect. */
  size?: number
  /** Backwards-compat alias for `size` (older callers used `w`). */
  w?: number
  className?: string
  style?: React.CSSProperties
  /** Turn off the global blink for a specific placement. */
  blink?: boolean
  /** Optional accessible label; defaults to decorative (aria-hidden). */
  title?: string
}

export function EyeMark({
  size,
  w,
  className,
  style,
  blink = true,
  title,
}: EyeMarkProps) {
  const rid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const eg = `sm-eye-${rid}`
  const pg = `sm-pup-${rid}`
  const width = size ?? w ?? 30
  const height = (width * 96) / 140
  return (
    <svg
      viewBox="0 0 140 96"
      width={width}
      height={height}
      className={`${blink ? 'shutap-blink ' : ''}${className ?? ''}`.trim()}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'visible',
        ...style,
      }}
    >
      <defs>
        <radialGradient id={eg} cx="38%" cy="22%" r="82%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="18%" stopColor="#ffd0e8" />
          <stop offset="48%" stopColor="#f060a0" />
          <stop offset="78%" stopColor="#c0206a" />
          <stop offset="100%" stopColor="#880040" />
        </radialGradient>
        <radialGradient id={pg} cx="50%" cy="42%" r="72%">
          <stop offset="0%" stopColor="#2a0d18" />
          <stop offset="100%" stopColor="#060106" />
        </radialGradient>
      </defs>
      {/* capsules */}
      <rect x="16" y="6" width="56" height="84" rx="28" fill={`url(#${eg})`} />
      <rect x="84" y="6" width="56" height="84" rx="28" fill={`url(#${eg})`} />
      {/* pupils */}
      <ellipse cx="44" cy="62" rx="19" ry="24" fill={`url(#${pg})`} />
      <ellipse cx="112" cy="62" rx="19" ry="24" fill={`url(#${pg})`} />
      {/* heart glints (approved brand mark) */}
      <path
        d="M44 22 C41 18 35 18 35 24 C35 30 44 36 44 36 C44 36 53 30 53 24 C53 18 47 18 44 22Z"
        fill="#ffffff"
        opacity=".95"
      />
      <path
        d="M112 22 C109 18 103 18 103 24 C103 30 112 36 112 36 C112 36 121 30 121 24 C121 18 115 18 112 22Z"
        fill="#ffffff"
        opacity=".95"
      />
    </svg>
  )
}

/** Accent wordmark: `shut` in local ink + `ap` in accent pink #e7548a. */
export function ShutapWordmark({
  size = 15,
  ink = '#0b080f',
  accent = '#e7548a',
  letterSpacing = '-.03em',
  style,
}: {
  size?: number
  ink?: string
  accent?: string
  letterSpacing?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: "'Sora', sans-serif",
        fontWeight: 800,
        fontSize: size,
        letterSpacing,
        color: ink,
        lineHeight: 1,
        ...style,
      }}
    >
      shut<span style={{ color: accent }}>ap</span>
    </span>
  )
}
