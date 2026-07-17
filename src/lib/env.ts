// Shared environment helpers. Client-only.
export const PROD_HOSTS = ['shutap.com', 'www.shutap.com']

/** True only on real production hostnames. Preview/dev hosts return false.
 *  Escape hatch: localStorage.shutap_ph_force === '1' forces true, so we can
 *  manually verify tracking end-to-end from a preview build. */
export function isProdHost(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.localStorage.getItem('shutap_ph_force') === '1') return true
  } catch { /* noop */ }
  return PROD_HOSTS.includes(window.location.hostname)
}
