// EyeMark — the canonical Shutap eye. Blinks. Transparent. Reuse everywhere.
// Glossy pink→magenta double-eye with white heart glint. Every visible
// brand-eye/wordmark lockup in-app should compose this + the accent wordmark.
import React from 'react'

export function EyeMark({ w = 34 }: { w?: number }) {
  const uid = React.useId()
  const bg = `bg-${uid.replace(/[^a-zA-Z0-9]/g, '')}`
  const pg = `pg-${uid.replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 140 96"
      width={w}
      height={(w * 96) / 140}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'visible',
        transformOrigin: 'center center',
        animation: 'shutap-blink 4.6s ease-in-out infinite',
      }}
      aria-hidden
    >
      <defs>
        <radialGradient id={bg} cx="38%" cy="22%" r="82%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="13%" stopColor="#ffd9ec" />
          <stop offset="40%" stopColor="#f26aa6" />
          <stop offset="70%" stopColor="#c8236e" />
          <stop offset="100%" stopColor="#8c1450" />
        </radialGradient>
        <radialGradient id={pg} cx="50%" cy="40%" r="72%">
          <stop offset="0%" stopColor="#3a1524" />
          <stop offset="100%" stopColor="#0a0206" />
        </radialGradient>
      </defs>
      {/* left eye */}
      <rect x="14" y="4" width="48" height="88" rx="24" fill={`url(#${bg})`} />
      <ellipse cx="38" cy="60" rx="18" ry="21" fill={`url(#${pg})`} />
      <path
        d="M38 45 C38 45 30 38.5 30 33.5 C30 30.7 32 29 34.6 29 C36.4 29 37.6 30 38 31.3 C38.4 30 39.6 29 41.4 29 C44 29 46 30.7 46 33.5 C46 38.5 38 45 38 45 Z"
        fill="#fff"
      />
      {/* right eye */}
      <rect x="78" y="4" width="48" height="88" rx="24" fill={`url(#${bg})`} />
      <ellipse cx="102" cy="60" rx="18" ry="21" fill={`url(#${pg})`} />
      <path
        d="M102 45 C102 45 94 38.5 94 33.5 C94 30.7 96 29 98.6 29 C100.4 29 101.6 30 102 31.3 C102.4 30 103.6 29 105.4 29 C108 29 110 30.7 110 33.5 C110 38.5 102 45 102 45 Z"
        fill="#fff"
      />
    </svg>
  )
}

/** Accent wordmark: `shut` in local ink + `ap` in accent pink #e7548a. */
export function ShutapWordmark({
  size = 15,
  ink = '#f7e8f0',
  accent = '#e7548a',
  letterSpacing = '-.03em',
}: {
  size?: number
  ink?: string
  accent?: string
  letterSpacing?: string
}) {
  return (
    <span
      style={{
        fontFamily: 'Sora,sans-serif',
        fontWeight: 800,
        fontSize: size,
        letterSpacing,
        color: ink,
        lineHeight: 1,
      }}
    >
      shut<span style={{ color: accent }}>ap</span>
    </span>
  )
}
