/* Shared channel chip row used by both ScanShareCard and MirrorShareSheet.
   Gen-Z chip design: round brand-colored disc with the platform glyph, with
   a tiny label below. Horizontally scrolls on narrow screens instead of
   wrapping into ragged rows. */
import type { CSSProperties } from 'react'

export type ChannelKey =
  | 'sms' | 'x' | 'instagram' | 'tiktok' | 'whatsapp' | 'copy' | 'download'

const LOGOS: Record<ChannelKey, string> = {
  sms: '<svg viewBox="0 0 24 24" fill="#fff" style="width:20px;height:20px"><path d="M12 2C6.5 2 2 5.8 2 10.5c0 2.5 1.3 4.7 3.3 6.2-.2 1.4-.9 2.8-1.9 3.9 1.7-.2 3.4-.8 4.8-1.7 1.2.3 2.5.5 3.8.5 5.5 0 10-3.8 10-8.5S17.5 2 12 2z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="#fff" style="width:17px;height:17px"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="#fff" style="width:20px;height:20px"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4zm6.4-10.4a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="#fff" style="width:18px;height:18px"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="#fff" style="width:20px;height:20px"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448zM6.597 20.13c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><rect x="9" y="9" width="13" height="13" rx="3"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
}

const LABELS: Record<ChannelKey, string> = {
  sms: 'iMessage',
  x: 'X',
  instagram: 'Insta',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  copy: 'Copy',
  download: 'Save',
}

function bg(k: ChannelKey): string {
  if (k === 'instagram') return 'linear-gradient(135deg,#feda75 0%,#fa7e1e 25%,#d62976 55%,#962fbf 78%,#4f5bd5 100%)'
  if (k === 'x') return '#0b080f'
  if (k === 'tiktok') return 'linear-gradient(135deg,#25F4EE 0%,#0b080f 45%,#FE2C55 100%)'
  if (k === 'whatsapp') return '#25D366'
  if (k === 'sms') return 'linear-gradient(160deg,#5BC8FF,#34C759)'
  if (k === 'copy') return 'linear-gradient(135deg,#b88cff,#7A7AE5)'
  return 'linear-gradient(135deg,#ffb1d8,#e7548a)'
}

const DEFAULT_CHANNELS: ChannelKey[] = [
  'sms', 'x', 'instagram', 'tiktok', 'whatsapp', 'copy', 'download',
]

export function ShareChannels({
  onPick,
  channels = DEFAULT_CHANNELS,
  style,
}: {
  onPick: (k: ChannelKey) => void
  channels?: ChannelKey[]
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: 'flex', gap: 14, padding: '4px 2px 8px',
        overflowX: 'auto', overflowY: 'hidden',
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
        justifyContent: 'flex-start',
        ...style,
      }}
      className="shutap-share-row"
    >
      {channels.map((k) => (
        <button
          key={k}
          onClick={() => onPick(k)}
          aria-label={`Share to ${LABELS[k]}`}
          style={{
            flex: '0 0 auto',
            display: 'inline-flex', flexDirection: 'column',
            alignItems: 'center', gap: 6,
            background: 'transparent', border: 0, padding: 0,
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: 50, height: 50, borderRadius: '50%',
              background: bg(k),
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(0,0,0,.35), inset 0 0 0 .5px rgba(255,255,255,.18)',
              transition: 'transform .18s ease',
            }}
            dangerouslySetInnerHTML={{ __html: LOGOS[k] }}
          />
          <span style={{
            fontFamily: 'Sora,sans-serif', fontSize: 10.5, fontWeight: 600,
            color: '#c9a3b6', letterSpacing: '.02em',
          }}>{LABELS[k]}</span>
        </button>
      ))}
      <style>{`.shutap-share-row::-webkit-scrollbar{display:none}
        .shutap-share-row button:active span:first-child{transform:scale(.93)}`}</style>
    </div>
  )
}

export function ActionPill({
  children, onClick, tone = 'ghost', ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'ghost' | 'primary'
  ariaLabel?: string
}) {
  const isPrimary = tone === 'primary'
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        fontFamily: 'Sora,sans-serif',
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: '.04em',
        color: isPrimary ? '#1a0814' : '#f7e8f0',
        background: isPrimary
          ? 'linear-gradient(135deg,#ffb1d8,#e7548a)'
          : 'rgba(255,255,255,.06)',
        border: isPrimary ? 'none' : '.5px solid rgba(255,255,255,.16)',
        borderRadius: 999,
        padding: '10px 18px',
        cursor: 'pointer',
        boxShadow: isPrimary ? '0 6px 18px rgba(231,84,138,.35)' : 'none',
      }}
    >
      {children}
    </button>
  )
}
