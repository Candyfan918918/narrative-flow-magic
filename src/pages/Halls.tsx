/* Minimal native Hall of Fame hub. The deep hall pages live at
 * /halls/$hall/$region/$window; this is just a discovery entry. */
import { Link } from '@tanstack/react-router'

import { SiteFooter } from '@/components/site/SiteFooter'
import { Words } from '@/components/motion'

const HALLS = [
  { slug: 'most-related', label: 'Most Related' },
  { slug: 'longest-thread', label: 'Longest Thread' },
  { slug: 'best-outcomes', label: 'Best Outcomes' },
]

export function HallOfFamePageNative() {
  return (
    <div style={{ background: '#fdf0f5', minHeight: '100vh' }}>
      
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '48px 22px 96px' }}>
        <Words as="h1" style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 36, margin: '0 0 12px' }}>
          hall of fame
        </Words>
        <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: '#6b4a5c', fontSize: 17, margin: '0 0 32px', maxWidth: '52ch' }}>
          The rooms people came back to. What happened next, told by people who actually lived it.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          {HALLS.map((h) => (
            <li key={h.slug}>
              <Link
                to="/halls/$hall/$region/$window"
                params={{ hall: h.slug, region: 'global', window: '30d' }}
                style={{
                  display: 'block', padding: '18px 20px', borderRadius: 14,
                  background: '#fff', border: '1px solid #f2d3e0', color: '#0b080f',
                  textDecoration: 'none', fontFamily: 'Sora,sans-serif', fontWeight: 600,
                }}
              >
                {h.label} →
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  )
}
