// Canonical Shutap lockup: eye + wordmark. Import this anywhere a "logo" is
// needed instead of composing eye + wordmark by hand.
import type { CSSProperties } from 'react'
import { EyeMark, ShutapWordmark } from './EyeMark'

export type ShutapLogoProps = {
  /** Light surfaces (pink/white bg) use dark ink; dark surfaces flip to off-white. */
  variant?: 'light' | 'dark'
  /** Eye width in px. Wordmark scales proportionally unless overridden. */
  size?: number
  /** Show or hide the wordmark. */
  withWordmark?: boolean
  /** Override the wordmark font size. */
  wordmarkSize?: number
  /** Extra letter-spacing for the wordmark. */
  letterSpacing?: string
  className?: string
  style?: CSSProperties
}

export function ShutapLogo({
  variant = 'light',
  size = 30,
  withWordmark = true,
  wordmarkSize,
  letterSpacing = '-.04em',
  className,
  style,
}: ShutapLogoProps) {
  const ink = variant === 'dark' ? '#f7e8f0' : '#0b080f'
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        ...style,
      }}
    >
      <EyeMark size={size} />
      {withWordmark ? (
        <ShutapWordmark
          size={wordmarkSize ?? Math.round(size * 0.63)}
          ink={ink}
          letterSpacing={letterSpacing}
        />
      ) : null}
    </span>
  )
}
