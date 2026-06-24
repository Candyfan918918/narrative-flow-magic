/* The eye-mascot radial gradients, injected once. Every eye SVG in the app
   references url(#eyeG) / url(#pupG). Mounted once at the app root. */
export function EyeDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <radialGradient id="eyeG" cx="40%" cy="18%" r="75%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="18%" stopColor="#ffd0e8" />
          <stop offset="48%" stopColor="#f060a0" />
          <stop offset="78%" stopColor="#c0206a" />
          <stop offset="100%" stopColor="#880040" />
        </radialGradient>
        <radialGradient id="pupG" cx="50%" cy="55%" r="58%">
          <stop offset="0%" stopColor="#3a1020" />
          <stop offset="100%" stopColor="#060106" />
        </radialGradient>
      </defs>
    </svg>
  )
}

/** Full eye mascot (two eyes + heart catchlights), parameterised by size. */
export function EyeMascot({
  w,
  h,
  blink = false,
  style,
}: {
  w: number
  h: number
  blink?: boolean
  style?: React.CSSProperties
}) {
  return (
    <span
      style={{
        width: w,
        height: h,
        display: 'block',
        transformOrigin: 'center',
        animation: blink ? 'eblink 3.4s infinite' : undefined,
        ...style,
      }}
    >
      <svg viewBox="0 0 140 96" fill="none" style={{ display: 'block', width: '100%', height: '100%' }}>
        <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
        <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
        <ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#pupG)" />
        <ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#pupG)" />
        <path
          d="M44 22 C41 18 35 18 35 24 C35 30 44 36 44 36 C44 36 53 30 53 24 C53 18 47 18 44 22Z"
          fill="#fff"
          opacity=".95"
        />
        <path
          d="M112 22 C109 18 103 18 103 24 C103 30 112 36 112 36 C112 36 121 30 121 24 C121 18 115 18 112 22Z"
          fill="#fff"
          opacity=".95"
        />
      </svg>
    </span>
  )
}

/** Raw eye SVG string (no heart catchlights) — matches Component.eyeSVG(w,h)
    in the prototype; used inside dangerouslySet HTML fragments. */
export function eyeSVG(w: number, h: number): string {
  return (
    '<svg viewBox="0 0 140 96" fill="none" style="display:block;width:' +
    w +
    'px;height:' +
    h +
    'px;flex:none"><rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG)"/><rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG)"/><ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#pupG)"/><ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#pupG)"/><path d="M44 22 C41 18 35 18 35 24 C35 30 44 36 44 36 C44 36 53 30 53 24 C53 18 47 18 44 22Z" fill="#fff" opacity=".95"/><path d="M112 22 C109 18 103 18 103 24 C103 30 112 36 112 36 C112 36 121 30 121 24 C121 18 115 18 112 22Z" fill="#fff" opacity=".95"/></svg>'
  )
}
