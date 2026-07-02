import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Alias } from '@/data/types'

/** Live alias display for the currently signed-in user. Reads from the
 *  aliases table (source of truth), falling back to the localStorage cache
 *  for instant paint. Refreshes on auth state changes. */
export function useCurrentAlias(): {
  alias: Alias | null
  userId: string | null
  refresh: () => Promise<void>
} {
  const [alias, setAlias] = useState<Alias | null>(() => {
    try {
      const r = localStorage.getItem('shutap_alias')
      return r ? (JSON.parse(r) as Alias) : null
    } catch { return null }
  })
  const [userId, setUserId] = useState<string | null>(null)

  const refresh = async () => {
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user?.id ?? null
    setUserId(uid)
    if (!uid) {
      setAlias(null)
      try { localStorage.removeItem('shutap_alias') } catch { /* noop */ }
      return
    }
    try {
      const { getMyAlias } = await import('@/lib/alias.functions')
      const row = await getMyAlias()
      if (row) {
        const next: Alias = { name: (row as { display_name?: string }).display_name, emoji: (row as { emoji?: string }).emoji }
        setAlias(next)
        try { localStorage.setItem('shutap_alias', JSON.stringify(next)) } catch { /* noop */ }
      }
    } catch { /* offline / no bearer — keep cache */ }
  }

  useEffect(() => {
    let mounted = true
    void refresh()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        void refresh()
      }
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  return { alias, userId, refresh }
}

export function useIsAdmin(): boolean {
  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!data.session) return
        const { getIsAdmin } = await import('@/lib/alias.functions')
        const isAdmin = await getIsAdmin()
        if (!dead) setAdmin(Boolean(isAdmin))
      } catch { /* noop */ }
    })()
    return () => { dead = true }
  }, [])
  return admin
}
