import { EyeMark as BrandEyeMark } from '@/components/brand/EyeMark'

export const BG = '#1a0a12'
export const TEXT = '#f7e8f0'
export const SOFT = '#c4a0b2'
export const MUTED = '#9e7a8c'
export const ACCENT = '#e7548a'

export const CREATURES = [
  { n: 'Owl', e: '🦉' }, { n: 'Fox', e: '🦊' }, { n: 'Bear', e: '🐻' }, { n: 'Lion', e: '🦁' },
  { n: 'Butterfly', e: '🦋' }, { n: 'Hedgehog', e: '🦔' }, { n: 'Swan', e: '🦢' }, { n: 'Wolf', e: '🐺' },
  { n: 'Hawk', e: '🦅' }, { n: 'Crane', e: '🕊' }, { n: 'Fawn', e: '🦌' }, { n: 'Hare', e: '🐇' },
  { n: 'Dove', e: '🕊' }, { n: 'Otter', e: '🦦' }, { n: 'Robin', e: '🐦' }, { n: 'Heron', e: '🪿' },
]
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function EyeMark({ size = 52 }: { size?: number }) {
  return (
    <span style={{ display: 'block', width: size, margin: '0 auto' }}>
      <BrandEyeMark size={size} />
    </span>
  )
}

export const oauthBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  width: '100%', padding: '15px 20px', borderRadius: 14,
  border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)',
  cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 15,
  color: TEXT, transition: '.18s',
}
export const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '15px 20px', background: ACCENT, border: 'none',
  borderRadius: 14, color: '#fff', fontFamily: "'Sora',sans-serif",
  fontWeight: 700, fontSize: 15, cursor: 'pointer',
}
export const ghostBtn: React.CSSProperties = {
  width: '100%', padding: '15px 20px', background: 'rgba(231,84,138,.12)',
  border: '1.5px solid rgba(231,84,138,.35)', borderRadius: 14, color: '#f7b8d4',
  fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer',
}
export const wheelSelect: React.CSSProperties = {
  appearance: 'none',
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.14)',
  borderRadius: 12,
  color: TEXT,
  fontFamily: "'Newsreader',serif",
  fontStyle: 'italic',
  fontSize: 16,
  padding: '12px 14px',
  minWidth: 80,
  textAlign: 'center',
  textAlignLast: 'center',
  cursor: 'pointer',
}

export type Msg = { kind: 'err' | 'ok'; text: string } | null
