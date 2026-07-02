// Themed document surface for the info/legal pages: sticky doc-nav on the
// left, main content on the right. Wraps SiteHeader + SiteFooter so every
// route using DocLayout has identical chrome.
import type { ReactNode } from 'react'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'

const DOC_NAV: { href: string; label: string }[] = [
  { href: '/terms', label: 'terms of service' },
  { href: '/privacy', label: 'privacy policy' },
  { href: '/guidelines', label: 'community guidelines' },
  { href: '/safety', label: 'crisis & safety' },
  { href: '/contact', label: 'contact' },
  { href: '/ai-disclosure', label: 'ai disclosure' },
]

export function DocLayout({
  active,
  title,
  subline,
  children,
}: {
  active: string
  title: string
  subline?: string
  children: ReactNode
}) {
  return (
    <div style={{ background: '#fdf0f5', minHeight: '100vh', color: '#1b0f16' }}>
      <SiteHeader />
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          padding: '0 22px',
          display: 'flex',
          gap: 40,
        }}
      >
        <aside
          className="shutap-doc-nav"
          style={{
            width: 188,
            flexShrink: 0,
            position: 'sticky',
            top: 58,
            alignSelf: 'flex-start',
            padding: '34px 0 40px',
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
              padding: '0 12px 10px',
            }}
          >
            trust &amp; legal
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {DOC_NAV.map((l) => {
              const isActive = l.href === active
              return (
                <a
                  key={l.href}
                  href={l.href}
                  style={{
                    display: 'block',
                    padding: '8px 12px',
                    borderRadius: 999,
                    fontFamily: 'Inter,sans-serif',
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#a01a55' : '#6b4a5c',
                    background: isActive ? '#fff' : 'transparent',
                    textDecoration: 'none',
                    transition: 'color .15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#a01a55'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#6b4a5c'
                  }}
                >
                  {l.label}
                </a>
              )
            })}
          </nav>
        </aside>
        <main
          style={{
            flex: 1,
            maxWidth: 680,
            padding: '34px 0 80px',
            minWidth: 0,
          }}
        >
          <header style={{ animation: 'shutap-doc-in .5s ease both' }}>
            <h1
              style={{
                fontFamily: 'Sora,sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(24px, 5vw, 32px)',
                letterSpacing: '-.02em',
                color: '#0b080f',
                margin: '0 0 8px',
                lineHeight: 1.15,
              }}
            >
              {title}
            </h1>
            {subline && (
              <p
                style={{
                  fontFamily: 'Newsreader,serif',
                  fontStyle: 'italic',
                  fontSize: 15,
                  color: '#6b4a5c',
                  margin: '0 0 24px',
                  lineHeight: 1.55,
                }}
              >
                {subline}
              </p>
            )}
          </header>
          <div className="shutap-doc-body">{children}</div>
        </main>
      </div>
      <SiteFooter />
      <style>{`
        .shutap-doc-body h3 {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #0b080f;
          margin: 26px 0 8px;
          letter-spacing: -.005em;
        }
        .shutap-doc-body p, .shutap-doc-body li {
          font-family: 'Inter', sans-serif;
          font-size: 14.5px;
          line-height: 1.7;
          color: #3a2630;
          margin: 0 0 10px;
        }
        .shutap-doc-body b { color: #1b0f16; }
        .shutap-doc-body ul { padding-left: 20px; margin: 0 0 10px; }
        .shutap-doc-body a { color: #c1216b; text-decoration: none; border-bottom: 1px solid rgba(193,33,107,.25); }
        .shutap-doc-body a:hover { color: #a01a55; }
        @keyframes shutap-doc-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 880px) {
          .shutap-doc-nav { display: none; }
        }
      `}</style>
    </div>
  )
}
