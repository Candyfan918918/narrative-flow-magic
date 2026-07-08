// Shared footer for info/legal pages. Link order matches DocLayout's doc-nav.
const INFO_LINKS: { href: string; label: string }[] = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/guidelines', label: 'Community Guidelines' },
  { href: '/safety', label: 'Crisis & Safety' },
  { href: '/contact', label: 'Contact' },
  { href: '/ai-disclosure', label: 'AI Disclosure' },
  { href: '/disclaimer', label: 'Medical / Legal Disclaimer' },
]

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: '.5px solid rgba(11,8,15,.08)',
        background: '#fdf3f6',
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          padding: '26px 22px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '8px 20px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
          {INFO_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="shutap-footer-link"
              style={{
                fontFamily: 'Inter,sans-serif',
                fontSize: 12.5,
                color: '#6b4a5c',
                textDecoration: 'none',
                padding: '2px 4px',
                borderRadius: 6,
                transition: 'color .15s',
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
        <div
          style={{
            fontFamily: 'Newsreader,serif',
            fontStyle: 'italic',
            fontSize: 12,
            color: '#9e7a8c',
          }}
        >
          18+ · pseudonymous · not a medical or legal service
        </div>
      </div>
      <style>{`
        .shutap-footer-link:hover { color: #a01a55; }
        .shutap-footer-link:focus-visible {
          outline: 2px solid #e7548a;
          outline-offset: 2px;
          border-radius: 6px;
        }
      `}</style>
    </footer>
  )
}
