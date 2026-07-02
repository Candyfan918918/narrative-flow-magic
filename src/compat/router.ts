/* React-router-dom → TanStack Router compatibility shim.
 * Lets pages that were written against react-router-dom continue to work
 * without pulling react-router-dom into the client bundle. */
import {
  Link as TanLink,
  useRouter,
  useLocation as tanUseLocation,
  useParams as tanUseParams,
  Navigate as TanNavigate,
} from '@tanstack/react-router'

type NavOpts = { replace?: boolean; state?: unknown }

export function useNavigate() {
  const router = useRouter()
  return (to: string | number, opts?: NavOpts) => {
    if (typeof to === 'number') {
      router.history.go(to)
      return
    }
    if (opts?.replace) router.history.replace(to, opts?.state)
    else router.history.push(to, opts?.state)
  }
}

export function useLocation() {
  const loc = tanUseLocation() as unknown as {
    pathname: string
    hash: string
    searchStr?: string
    search?: unknown
    state?: unknown
  }
  const search =
    typeof loc.searchStr === 'string'
      ? loc.searchStr
      : typeof loc.search === 'string'
        ? loc.search
        : ''
  return {
    pathname: loc.pathname,
    hash: loc.hash ?? '',
    search: search ? (search.startsWith('?') ? search : '?' + search) : '',
    state: loc.state ?? null,
  }
}

export function useSearchParams() {
  const loc = useLocation()
  const nav = useNavigate()
  const params = new URLSearchParams(loc.search)
  const set = (
    next: URLSearchParams | Record<string, string> | ((p: URLSearchParams) => URLSearchParams | void),
    opts?: NavOpts,
  ) => {
    let sp: URLSearchParams
    if (typeof next === 'function') {
      const p = new URLSearchParams(loc.search)
      const r = next(p)
      sp = r instanceof URLSearchParams ? r : p
    } else if (next instanceof URLSearchParams) {
      sp = next
    } else {
      sp = new URLSearchParams(next)
    }
    const q = sp.toString()
    nav(`${loc.pathname}${q ? '?' + q : ''}${loc.hash}`, { replace: opts?.replace ?? true })
  }
  return [params, set] as const
}

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return tanUseParams({ strict: false }) as unknown as T
}

// TanStack Link accepts arbitrary hrefs. Cast for react-router-dom's looser
// prop surface (children, to as string, onClick, className, style).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Link: any = TanLink
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Navigate: any = TanNavigate
