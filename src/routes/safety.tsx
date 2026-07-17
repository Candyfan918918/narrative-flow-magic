import { createFileRoute } from '@tanstack/react-router'
import { ogImageMeta } from "@/lib/seo/meta";
import { DocLayout } from '@/components/site/DocLayout'
import { SITE_URL } from '@/lib/site'

const URL = `${SITE_URL}/safety`
const TITLE = 'Crisis & Safety — Shutap'
const DESCRIPTION =
  'Shutap isn\u2019t a crisis service. If you\u2019re in crisis you deserve real human help now — 988 in the US, Samaritans in the UK, findahelpline anywhere.'

type Card = { name: string; action: string; href: string; external?: boolean }

const CARDS: Card[] = [
  { name: 'US — 988 Suicide & Crisis Lifeline', action: 'call or text 988', href: 'tel:988' },
  { name: 'UK — Samaritans', action: 'call 116 123', href: 'tel:116123' },
  {
    name: 'Anywhere — findahelpline.com',
    action: 'find a line in your country',
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
      ...ogImageMeta(),
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
      title="Crisis & Safety"
      subline="you deserve real, human help — right now"
    >
      <p>
        Shutap isn&rsquo;t a crisis service, and our companion isn&rsquo;t a counselor. If
        you&rsquo;re in crisis, you deserve real, human help right now:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '18px 0' }}>
        {CARDS.map((c) => (
          <a
            key={c.href}
            href={c.href}
            target={c.external ? '_blank' : undefined}
            rel={c.external ? 'noopener' : undefined}
            style={{
              textDecoration: 'none',
              background: '#fff',
              border: '.5px solid rgba(11,8,15,.1)',
              borderRadius: 14,
              padding: '15px 17px',
              display: 'block',
            }}
          >
            <div
              style={{
                fontFamily: 'Sora,sans-serif',
                fontWeight: 700,
                fontSize: 14.5,
                color: '#0b080f',
              }}
            >
              {c.name}
            </div>
            <div style={{ fontSize: 13, color: '#6b4a5c', marginTop: 2 }}>{c.action}</div>
          </a>
        ))}
      </div>
      <p>
        When our companion notices something serious, it will stop and point you here. Crisis
        messages are kept private, are never made public, and are never used for anything but
        supporting you. You&rsquo;re not alone. 🤍
      </p>
    </DocLayout>
  )
}
