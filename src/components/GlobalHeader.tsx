/* GlobalHeader — single sticky header rendered by the root layout for
 * every page (landing, stream, room, halls, mirror, subscribe, legal,
 * profile, welcome, admin, 404). Consolidates the previous Header and
 * SiteHeader. Auto-derives light/dark variant from pathname, hides the
 * "join →" pill on /welcome, and mounts a slim admin sub-nav under the
 * bar on /admin/* routes for real admins. */
import { useEffect, useRef, useState } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { rememberReturnTo, signOut as doSignOut } from '@/lib/auth'
import { useCurrentAlias, useIsAdmin } from '@/hooks/use-current-alias'
import { EyeMark, ShutapWordmark } from './EyeMark'

type Variant = 'light' | 'dark'

// Routes that render on dark surfaces get the dark chrome.
function variantFor(pathname: string): Variant {
  if (pathname === '/welcome') return 'dark'
  if (pathname === '/mirror' || pathname.startsWith('/mirror/')) return 'dark'
  return 'light'
}

const ADMIN_NAV: { to: string; label: string }[] = [
  { to: '/admin', label: 'admin' },
  { to: '/admin/analytics', label: 'analytics' },
  { to: '/admin/users', label: 'users' },
  { to: '/admin/events', label: 'events' },
  { to: '/admin/feedback', label: 'feedback' },
  { to: '/admin/relate-queue', label: 'relate queue' },
]

export function GlobalHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const variant = variantFor(pathname)
  const dark = variant === 'dark'
  const navigate = useNavigate()
  const { alias } = useCurrentAlias()
  const admin = useIsAdmin()
  const [menuOpen, setMenuOpen] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)
  const isWelcome = pathname === '/welcome'
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const join = () => {
    try { rememberReturnTo(window.location.href) } catch { /* noop */ }
    navigate({ to: '/welcome' })
  }
  const signOut = async () => {
    setMenuOpen(false)
    await doSignOut()
    navigate({ to: '/' })
  }

  const inkStrong = dark ? '#f7e8f0' : '#0b080f'
  const inkMuted = dark ? '#c4a0b2' : '#6b4a5c'
  const inkActive = dark ? '#f7e8f0' : '#0b080f'
  const barBg = dark ? 'rgba(16,8,16,.82)' : 'rgba(253,240,245,.88)'
  const barBorder = dark ? '.5px solid rgba(255,255,255,.08)' : '.5px solid rgba(11,8,15,.07)'
  const pillBg = dark ? 'rgba(255,255,255,.04)' : '#fff'
  const pillBorder = dark ? '.5px solid rgba(255,255,255,.10)' : '.5px solid rgba(11,8,15,.12)'
  const menuBg = dark ? '#1a0d18' : '#fff'
  const menuBorder = dark ? '.5px solid rgba(255,255,255,.10)' : '.5px solid rgba(11,8,15,.10)'
  const menuDivider = dark ? 'rgba(255,255,255,.08)' : 'rgba(11,8,15,.08)'
  const menuInk = dark ? '#f7e8f0' : '#4a3040'

  const navLink = (to: string, label: string) => {
    const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
    return (
      <Link
        to={to}
        style={{
          fontFamily: "'Newsreader',serif",
          fontStyle: 'italic',
          fontSize: 14,
          color: active ? inkActive : inkMuted,
          textDecoration: 'none',
          padding: '6px 12px',
        }}
      >
        {label}
      </Link>
    )
  }

  const menuItem: React.CSSProperties = {
    display: 'block',
    padding: '9px 11px',
    borderRadius: 10,
    fontFamily: "'Newsreader',serif",
    fontStyle: 'italic',
    fontSize: 14,
    color: menuInk,
    textDecoration: 'none',
    cursor: 'pointer',
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: barBg,
        backdropFilter: 'blur(18px)',
        borderBottom: barBorder,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '11px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}
        >
          <EyeMark size={32} />
          <ShutapWordmark size={19} ink={inkStrong} letterSpacing="-.04em" />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {navLink('/stream', 'rooms')}
          {navLink('/halls', 'halls')}

          <div ref={areaRef} style={{ position: 'relative' }}>
            {alias ? (
              <>
                <div
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen((v) => !v)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    background: pillBg,
                    border: pillBorder,
                    borderRadius: 999,
                    padding: '5px 12px 5px 5px',
                    cursor: 'pointer',
                    transition: '.18s',
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#f060a0,#890041)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 14,
                      flex: 'none',
                    }}
                  >
                    {alias.emoji || '🐣'}
                  </span>
                  <span style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 13, color: inkStrong }}>
                    {alias.name || ''}
                  </span>
                </div>
                {menuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 9px)',
                      right: 0,
                      width: 220,
                      background: menuBg,
                      border: menuBorder,
                      borderRadius: 16,
                      boxShadow: dark
                        ? '0 24px 50px -16px rgba(0,0,0,.6)'
                        : '0 24px 50px -24px rgba(60,10,30,.35)',
                      padding: 7,
                      zIndex: 70,
                    }}
                  >
                    <Link to="/profile" style={menuItem} onClick={() => setMenuOpen(false)}>your profile</Link>
                    <div
                      role="button"
                      style={{ ...menuItem, color: dark ? '#f7b8d4' : '#c1216b' }}
                      onClick={() => { setMenuOpen(false); navigate({ to: '/', hash: 'spill' }) }}
                    >
                      spill it →
                    </div>
                    <Link to="/mirror" style={{ ...menuItem, color: dark ? '#e6c37a' : '#7F77DD' }} onClick={() => setMenuOpen(false)}>
                      the mirror ✦
                    </Link>
                    {admin && (
                      <Link to="/admin" style={menuItem} onClick={() => setMenuOpen(false)}>
                        admin dashboard
                      </Link>
                    )}
                    <div style={{ height: '.5px', background: menuDivider, margin: '6px 0' }} />
                    <div
                      role="button"
                      style={{ ...menuItem, color: dark ? '#c4a0b2' : '#9e7a8c' }}
                      onClick={signOut}
                    >
                      sign out
                    </div>
                  </div>
                )}
              </>
            ) : isWelcome ? (
              // On /welcome the user is already inside the join flow —
              // render an inert placeholder so header spacing stays stable
              // and there's no "join → welcome" tautology.
              <span aria-hidden style={{ width: 72, height: 34, display: 'inline-block' }} />
            ) : (
              <button
                type="button"
                onClick={join}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#e7548a',
                  color: '#fff',
                  border: 0,
                  borderRadius: 999,
                  padding: '9px 18px',
                  fontFamily: 'Sora,sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                join →
              </button>
            )}
          </div>
        </div>
      </div>

      {isAdminPath && admin && (
        <div
          style={{
            borderTop: barBorder,
            background: dark ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.55)',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '6px 22px',
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'Sora,sans-serif',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: inkMuted,
              }}
            >
              admin
            </span>
            {ADMIN_NAV.map((n) => {
              const active = pathname === n.to
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  style={{
                    fontFamily: 'Inter,sans-serif',
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#c1216b' : inkMuted,
                    textDecoration: 'none',
                  }}
                >
                  {n.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
