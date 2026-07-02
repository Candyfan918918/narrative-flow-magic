// Shared global header used by info/legal routes. Visually identical to the
// SPA Header (Landing/Stream/Profile). Uses TanStack Link so it works inside
// SSR routes; the auth control is client-only.
import { useEffect, useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { EyeMark, ShutapWordmark } from '@/components/EyeMark'

type AliasChip = { emoji: string; name: string; admin: boolean }

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [mounted, setMounted] = useState(false)
  const [alias, setAlias] = useState<AliasChip | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    let dead = false
    ;(async () => {
      try {
        // Read the same alias the SPA uses without importing the SPA router.
        const [{ getAlias, isAdmin }] = await Promise.all([import('@/lib/auth')])
        const a = getAlias()
        if (!dead && a) setAlias({ emoji: a.emoji ?? '✦', name: a.name ?? 'you', admin: isAdmin() })
      } catch {
        /* not signed in / auth module unavailable in this context */
      }
    })()
    return () => {
      dead = true
    }
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href))
    return (
      <a
        key={href}
        href={href}
        style={{
          fontFamily: 'Newsreader,serif',
          fontStyle: 'italic',
          fontSize: 14,
          color: active ? '#a01a55' : '#6b4a5c',
          textDecoration: 'none',
          padding: '6px 12px',
          borderRadius: 999,
        }}
      >
        {label}
      </a>
    )
  }

  const signOut = async () => {
    setMenuOpen(false)
    try {
      const { signOut: doSignOut } = await import('@/lib/auth')
      doSignOut()
    } catch {
      /* noop */
    }
    setAlias(null)
    if (typeof window !== 'undefined') window.location.href = '/'
  }

  const join = () => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('shutap.returnTo', window.location.href)
      }
    } catch {
      /* noop */
    }
    if (typeof window !== 'undefined') window.location.href = '/welcome'
  }

  const menuItem: React.CSSProperties = {
    display: 'block',
    padding: '9px 11px',
    borderRadius: 10,
    fontFamily: 'Newsreader,serif',
    fontStyle: 'italic',
    fontSize: 14,
    color: '#4a3040',
    textDecoration: 'none',
    cursor: 'pointer',
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(253,240,245,.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '.5px solid rgba(11,8,15,.07)',
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          padding: '12px 22px',
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
          <EyeMark w={30} />
          <ShutapWordmark size={17} ink="#0b080f" accent="#e7548a" letterSpacing="-.04em" />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} ref={areaRef}>
          {navLink('/stream', 'rooms')}
          {navLink('/halls', 'halls')}
          {!mounted ? (
            <span style={{ width: 78, height: 34 }} aria-hidden />
          ) : alias ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#fff',
                  border: '.5px solid rgba(11,8,15,.10)',
                  borderRadius: 999,
                  padding: '6px 12px 6px 8px',
                  cursor: 'pointer',
                  fontFamily: 'Newsreader,serif',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: '#1b0f16',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#fdf0f5',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                  }}
                >
                  {alias.emoji}
                </span>
                {alias.name}
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: 210,
                    background: '#fff',
                    border: '.5px solid rgba(11,8,15,.10)',
                    borderRadius: 16,
                    boxShadow: '0 24px 50px -24px rgba(60,10,30,.35)',
                    padding: 7,
                    zIndex: 70,
                  }}
                >
                  <a href="/profile" style={menuItem}>your profile</a>
                  <a href="/profile#settings" style={menuItem}>settings</a>
                  <a href="/#spill" style={{ ...menuItem, color: '#c1216b' }}>spill it →</a>
                  <a href="/mirror" style={{ ...menuItem, color: '#7F77DD' }}>the mirror ✦</a>
                  {alias.admin && <a href="/admin" style={menuItem}>admin dashboard</a>}
                  <div style={{ height: '.5px', background: 'rgba(11,8,15,.08)', margin: '6px 0' }} />
                  <div role="button" onClick={signOut} style={{ ...menuItem, color: '#9e7a8c' }}>
                    sign out
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              role="button"
              onClick={join}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#e7548a',
                color: '#fff',
                borderRadius: 999,
                padding: '9px 18px',
                fontFamily: 'Sora,sans-serif',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              join →
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
