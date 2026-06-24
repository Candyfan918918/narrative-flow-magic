import { useState } from 'react'
import { Header } from '../components/Header'
import { setAlias } from '../lib/auth'

const ADJ = ['Quiet', 'Defiant', 'Tender', 'Wistful', 'Patient', 'Mortified', 'Restless', 'Gentle', 'Brave', 'Soft']
const NAT = ['Nigerian', 'Kenyan', 'Polish', 'Indian', 'Brazilian', 'Ethiopian', 'Filipino', 'Pakistani', 'Korean', 'Welsh']
const ANIMALS: [string, string][] = [
  ['Swan', '🦢'],
  ['Lion', '🦁'],
  ['Hedgehog', '🦔'],
  ['Dove', '🕊'],
  ['Butterfly', '🦋'],
  ['Hare', '🐇'],
  ['Owl', '🦉'],
  ['Fox', '🦊'],
  ['Wolf', '🐺'],
  ['Heron', '🪿'],
]
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

/* Minimal alias ceremony — the slot-machine that gives every member one
   persistent pseudonym (no real name, ever). The full ceremony (OAuth → 18+
   birthday wheel) is described in the bundle; this writes the alias and returns
   the user to wherever they came from. */
export function WelcomePage() {
  const [animal, emoji] = pick(ANIMALS)
  const [alias, setAliasLocal] = useState<{ name: string; emoji: string }>({
    name: `${pick(ADJ)} ${pick(NAT)} ${animal}`,
    emoji,
  })

  const spin = () => {
    const [a, e] = pick(ANIMALS)
    setAliasLocal({ name: `${pick(ADJ)} ${pick(NAT)} ${a}`, emoji: e })
  }

  const keep = () => {
    setAlias(alias)
    let dest = '/stream'
    try {
      const rt = sessionStorage.getItem('shutap_returnTo')
      if (rt) {
        sessionStorage.removeItem('shutap_returnTo')
        // returnTo is a same-origin absolute URL; pull its path+hash
        const u = new URL(rt, window.location.origin)
        dest = u.pathname + u.search + u.hash
      }
    } catch {
      /* noop */
    }
    window.location.href = dest
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '56px 22px 120px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15, color: '#6b4a5c', marginBottom: 20 }}>
          everyone here — teller and room alike — sits under a pseudonym. your real name never enters this room. that
          protection is what makes it possible to be frank.
        </div>

        <div
          style={{
            background: '#fff',
            border: '.5px solid rgba(11,8,15,.08)',
            borderRadius: 22,
            padding: '40px 28px',
            boxShadow: '0 10px 28px -22px rgba(60,10,30,.28)',
          }}
        >
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9e7a8c', marginBottom: 18 }}>
            your alias
          </div>
          <div style={{ fontSize: 52, marginBottom: 12, animation: 'bob 3s ease-in-out infinite' }}>{alias.emoji}</div>
          <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 24, color: '#0b080f', marginBottom: 28 }}>{alias.name}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={spin}
              style={{
                border: '1.5px solid rgba(11,8,15,.12)',
                background: '#fff',
                borderRadius: 999,
                padding: '11px 20px',
                cursor: 'pointer',
                fontFamily: 'Newsreader,serif',
                fontStyle: 'italic',
                fontSize: 14.5,
                color: '#4a3040',
              }}
            >
              spin again ↻
            </button>
            <button
              onClick={keep}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg,#f060a0,#c1216b)',
                color: '#fff',
                borderRadius: 999,
                padding: '11px 22px',
                cursor: 'pointer',
                fontFamily: 'Sora,sans-serif',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              keep this name →
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
