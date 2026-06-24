import type { Alias } from '../data/types'

/* Pseudonymous identity lives only in localStorage (mirrors the prototype).
   No real name, email, or identity ever enters the app. */
export function getAlias(): Alias | null {
  try {
    const r = localStorage.getItem('shutap_alias')
    return r ? (JSON.parse(r) as Alias) : null
  } catch {
    return null
  }
}

export function setAlias(alias: Alias): void {
  try {
    localStorage.setItem('shutap_alias', JSON.stringify(alias))
  } catch {
    /* storage unavailable — stay anonymous */
  }
}

export function signOut(): void {
  try {
    localStorage.removeItem('shutap_alias')
  } catch {
    /* noop */
  }
}

export function isAdmin(): boolean {
  try {
    return localStorage.getItem('shutap_role') === 'admin'
  } catch {
    return false
  }
}

/** Save where the user was before bouncing to the join ceremony. */
export function rememberReturnTo(href: string): void {
  try {
    sessionStorage.setItem('shutap_returnTo', href)
  } catch {
    /* noop */
  }
}
