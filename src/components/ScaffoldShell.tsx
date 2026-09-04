import { useNavigate } from '@/compat/router'
import { Header } from './Header'
import { CompanionBubble } from './CompanionBubble'
import { useToast } from './Toast'

/* Shared chrome for the linked pages: sticky header, the companion on every
   page (tapping it jumps to the Stream's Ask flow), and a centered body. */
export function ScaffoldShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { toast, ToastHost } = useToast()
  return (
    <>
      <Header onToast={toast} />
      <main style={{ maxWidth: 740, margin: '0 auto', padding: '40px 22px 120px' }}>{children}</main>
      <CompanionBubble onOpen={() => navigate('/stream')} />
      {ToastHost}
    </>
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'Newsreader,serif',
        fontStyle: 'italic',
        fontSize: 14,
        color: '#443c42',
        marginBottom: 10,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5DCAA5', animation: 'breathe 3s ease-in-out infinite', display: 'block' }} />
      {children}
    </div>
  )
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: 'Newsreader,serif',
        fontStyle: 'italic',
        fontWeight: 400,
        fontSize: 'clamp(26px,5vw,36px)',
        lineHeight: 1.2,
        margin: '0 0 10px',
        color: '#0b080f',
      }}
    >
      {children}
    </h1>
  )
}

export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15.5, color: '#443c42', margin: '0 0 24px', maxWidth: '52ch' }}>
      {children}
    </p>
  )
}
