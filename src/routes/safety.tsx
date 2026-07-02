import { createFileRoute } from '@tanstack/react-router'
import { DocLayout } from '@/components/site/DocLayout'
import { SITE_URL } from '@/lib/site'

const URL = `${SITE_URL}/safety`
const TITLE = 'Crisis & Safety — Shutap'
const DESCRIPTION =
  'shutap isn\u2019t a crisis service. if you\u2019re in crisis you deserve real human help now — 988 in the US, Samaritans in the UK, findahelpline.com anywhere.'

type Card = {
  region: string
  name: string
  action: string
  href: string
  external?: boolean
}

const CARDS: Card[] = [
  {
    region: 'US',
    name: '988 Suicide & Crisis Lifeline',
    action: 'call or text 988',
    href: 'tel:988',
  },
  {
    region: 'UK',
    name: 'Samaritans',
    action: 'call 116 123',
    href: 'tel:116123',
  },
  {
    region: 'Anywhere',
    name: 'findahelpline.com',
    action: 'find a helpline near you',
    href: 'https://findahelpline.com',
    external: true,
  },
]

export const Route = createFileRoute('/safety')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: URL },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: URL }],
  }),
  component: SafetyPage,
})

function SafetyPage() {
  return (
    <DocLayout
      active="/safety"
      title="crisis & safety"
      subline={"shutap isn\u2019t a crisis service, and the companion isn\u2019t a counselor. if you\u2019re in crisis, you deserve real human help right now."}
    >
      <p style={{ marginTop: 0, marginBottom: 14 }}>
        if you&apos;re in crisis right now, reach a real person:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {CARDS.map((c) => (
          <a
            key={c.region}
            href={c.href}
            target={c.external ? '_blank' : undefined}
            rel={c.external ? 'noreferrer' : undefined}
            style={{
              display: 'block',
              background: '#fff',
              border: '.5px solid rgba(11,8,15,.10)',
              borderRadius: 16,
              padding: '18px 20px',
              textDecoration: 'none',
              transition: 'transform .15s, border-color .15s, box-shadow .15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.borderColor = 'rgba(231,84,138,.55)'
              e.currentTarget.style.boxShadow = '0 12px 30px -18px rgba(80,10,45,.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(11,8,15,.10)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div
              style={{
                fontFamily: 'Sora,sans-serif',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: '#9e7a8c',
                marginBottom: 4,
              }}
            >
              {c.region}
            </div>
            <div
              style={{
                fontFamily: 'Sora,sans-serif',
                fontWeight: 700,
                fontSize: 17,
                color: '#0b080f',
                marginBottom: 4,
              }}
            >
              {c.name}
            </div>
            <div
              style={{
                fontFamily: 'Inter,sans-serif',
                fontSize: 14,
                color: '#c1216b',
                fontWeight: 600,
              }}
            >
              {c.action} →
            </div>
          </a>
        ))}
      </div>

      <p style={{ marginTop: 28 }}>
        crisis-flagged content on shutap is kept private, never made public, and never used for
        anything except supporting the person who wrote it.
      </p>
    </DocLayout>
  )
}
