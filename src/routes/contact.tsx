import { createFileRoute } from '@tanstack/react-router'
import { DocLayout } from '@/components/site/DocLayout'
import { SITE_URL } from '@/lib/site'

const URL = `${SITE_URL}/contact`
const TITLE = 'Contact — Shutap'
const DESCRIPTION =
  'shutap is small on purpose. a real person reads every message. write us at hello@shutap.com, privacy@shutap.com, safety@shutap.com, or legal@shutap.com.'

type Card = { label: string; email: string; sub: string }

const CARDS: Card[] = [
  {
    label: 'general',
    email: 'hello@shutap.com',
    sub: 'questions, feedback, or just saying hi.',
  },
  {
    label: 'privacy & your data',
    email: 'privacy@shutap.com',
    sub: 'export or delete your account, GDPR/CCPA requests, anything about your data.',
  },
  {
    label: 'safety & reports',
    email: 'safety@shutap.com',
    sub: 'report a story, comment, or member. or a real-world safety concern about someone here.',
  },
  {
    label: 'legal',
    email: 'legal@shutap.com',
    sub: 'takedowns, legal process, terms questions, press.',
  },
]

export const Route = createFileRoute('/contact')({
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
  component: ContactPage,
})

function ContactPage() {
  return (
    <DocLayout
      active="/contact"
      title="contact"
      subline="shutap is small on purpose. a real person reads every message and writes back (usually within a couple of days)."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CARDS.map((c) => (
          <a
            key={c.email}
            href={`mailto:${c.email}`}
            className="shutap-contact-card"
          >
            <div className="shutap-contact-row">
              <span
                style={{
                  fontFamily: 'Sora,sans-serif',
                  fontWeight: 700,
                  fontSize: 14.5,
                  color: '#0b080f',
                  letterSpacing: '-.005em',
                }}
              >
                {c.label}
              </span>
              <span
                style={{
                  fontFamily: 'Sora,sans-serif',
                  fontWeight: 600,
                  fontSize: 13.5,
                  color: '#c1216b',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.email} <span aria-hidden style={{ marginLeft: 2 }}>→</span>
              </span>
            </div>
            <div
              style={{
                fontFamily: 'Inter,sans-serif',
                fontSize: 13,
                color: '#6b4a5c',
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {c.sub}
            </div>
          </a>
        ))}
      </div>

      <p style={{ marginTop: 22 }}>
        in an emergency, please don&apos;t email us — we can&apos;t respond in real time. use the{' '}
        <a href="/safety">crisis lines →</a>
      </p>

      <p
        style={{
          fontFamily: 'Newsreader,serif',
          fontStyle: 'italic',
          fontSize: 14,
          color: '#6b4a5c',
          marginTop: 20,
        }}
      >
        18+, pseudonymous, not a medical or legal service. please don&apos;t send anything that
        could identify you or someone else unless it&apos;s necessary.
      </p>
      <style>{`
        .shutap-contact-card {
          display: block;
          background: #fff;
          border: .5px solid rgba(11,8,15,.08);
          border-radius: 14px;
          padding: 15px 17px;
          text-decoration: none;
          transition: transform .15s, border-color .15s, box-shadow .15s;
        }
        .shutap-contact-card:hover {
          transform: translateY(-1px);
          border-color: rgba(231,84,138,.5);
          box-shadow: 0 12px 26px -20px rgba(80,10,45,.3);
        }
        .shutap-contact-card:focus-visible {
          outline: 2px solid #e7548a;
          outline-offset: 2px;
          border-radius: 14px;
        }
        .shutap-contact-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: nowrap;
        }
        @media (max-width: 420px) {
          .shutap-contact-row {
            flex-wrap: wrap;
            gap: 4px 12px;
          }
        }
      `}</style>
    </DocLayout>
  )
}

