/* MirrorTeaser — pixel-parity port of the mirror teaser card on the landing hero.
   Source: public/shutap/Landing.dc.html line ~200. Onclick → onOpen (parent
   navigates to /mirror to match the iframe's openMirror() → mirror route). */

const SORA = "'Sora', system-ui, sans-serif"
const NEWSREADER = "'Newsreader', Georgia, serif"

export function MirrorTeaser({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        textAlign: 'left',
        marginTop: 12,
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'linear-gradient(160deg,#2e0d1a,#1a0a12)',
        border: '.5px solid rgba(231,84,138,.32)',
        borderRadius: 16,
        padding: '13px 15px',
        cursor: 'pointer',
      }}
    >
      <span style={{ width: 30, height: 21, display: 'block', flex: 'none' }}>
        <svg viewBox="0 0 140 96" fill="none" style={{ display: 'block', width: '100%', height: '100%' }}>
          <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
          <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
          <ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#pupG)" />
          <ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#pupG)" />
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 14, color: '#f7e8f0' }}>
          the mirror <span style={{ color: '#e9c06a' }}>✦</span>
        </div>
        <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 12.5, color: '#caaebb', marginTop: 2, lineHeight: 1.4 }}>
          your patterns &amp; your arc — drawn from everything you&rsquo;ve poured in.
        </div>
      </div>
      <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 12.5, color: '#f7b8d4', flex: 'none' }}>open →</span>
    </button>
  )
}
