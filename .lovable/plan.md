
# Performance + Auth Refactor Plan

Priority order matches your spec. All changes preserve current visual design and URLs.

## 1. Native `/welcome` (no iframe)

- Create `src/routes/welcome.tsx` (ssr:false, immediate shell) rendering a new `src/pages/WelcomeNative.tsx`.
- Pixel-match current design: auth sheet → age gate → alias mint/re-roll (reuse styles from `Welcome.dc.html`, but as React JSX using the same tokens/CSS the native landing already uses).
- Wire real auth directly:
  - Google/Apple: `lovable.auth.signInWithOAuth("google" | "apple", { redirect_uri: origin + "/welcome" })`.
  - Email: `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: origin + "/welcome" } })`.
  - On mount: if `supabase.auth.getSession()` returns a session, skip auth sheet → jump to age gate or alias step depending on whether alias exists.
- After alias mint: `upsertMyAlias` → `recordLegalAcceptance` → consume `shutap_pending_comment` / `shutap_pending_save` and navigate.
- Delete the iframe file `src/pages/Welcome.tsx` + its 250ms click-bridge and postMessage injection.

## 2. Remove BrowserRouter + react-helmet-async — migrate SPA to TanStack file routes

Migrate these existing `react-router-dom` pages into `src/routes/`:

| New route file | Component | Notes |
|---|---|---|
| `src/routes/stream.tsx` | wraps existing `StreamPage` | keep `#room-<id>` hash behavior |
| `src/routes/room.tsx` | `RoomPage` (reads `?id=` search) | keep current URL |
| `src/routes/halls.tsx` | `HallOfFamePage` | |
| `src/routes/profile.tsx` | `ProfilePage` | client-only |
| `src/routes/mirror.tsx` | `MirrorPage` | client-only |
| `src/routes/subscribe.tsx` | `SubscribePage` | |
| `src/routes/subscribe.return.tsx` | `SubscribeReturnPage` | |
| `src/routes/admin.tsx` + `.feedback` + `.relate-queue` | `AdminPage`, etc | client-only |
| existing `src/routes/legal.tsx` | keep, ensure `LegalPage` mounts natively | drop iframe |

Each route uses `ssr:false` (auth-heavy) except landing/stream. Fallback: a small branded eye+"Loading…" component, not `null`.

Update every `useNavigate` / `<Link>` / `useLocation` / `useParams` inside the migrated components to the TanStack equivalents. Because these live in `src/pages/*.tsx` and `src/components/*.tsx` today, this is mostly:
- `import { useNavigate } from 'react-router-dom'` → `from '@tanstack/react-router'`
- `navigate('/stream')` → `navigate({ to: '/stream' })`
- `<Link to="/x">` API is already compatible.

Delete `src/App.tsx`, `src/components/SpaShell.tsx`, `src/routes/index.tsx` (replaced by direct native LandingPage), the `Suspense` splash. Old `src/routes/$.tsx` catchall stays, but points to a `<Navigate to="/stream">` equivalent using TanStack.

Uninstall: `react-router-dom`, `react-helmet-async`. Sweep for stragglers.

## 3. SSR / prerender landing + stream

- `src/routes/index.tsx`: remove `ssr:false`, render `<LandingNativePage />` directly. Iframe fallback (`?legacy=1`) becomes a client-only branch behind `useHydrated()`. All Supabase / auth calls in LandingPage move into `useEffect` (audit needed — the native landing already uses hooks + tanstack-query, should be fine).
- `src/routes/stream.tsx`: SSR-enabled. Loader uses public read of the rooms list via a `createServerFn` with the publishable server client + narrow `TO anon` SELECT (already available for rooms). Client hydrates and takes over for realtime/auth-scoped bits.
- Everything auth-gated stays client-hydrated.

## 4. Font diet

Audit tells us which of `Sora`, `Newsreader`, `Inter`, `Cormorant Garamond` are actually referenced. Working assumption from grep:
- Sora: used (display).
- Newsreader: used (serif italics).
- Inter: used (body).
- Cormorant Garamond: check Mirror card — if only there, keep at 1 weight; otherwise drop.

Replace the current 4-family, ~17-variant `<link>` in `__root.tsx` with a single Google Fonts URL containing only the weights we render, `&display=swap`. Preload the two most critical woff2 files (probably Sora 600 + Inter 500) via `<link rel="preload" as="font" ...>` with `crossorigin`. Remove references to `/public/shutap/bundle/*.woff2` and `/public/shutap/vendor/react*` from any first-party route.

## 5. Kill the refetch storm

In `src/routes/__root.tsx` `onAuthStateChange`:

```ts
let lastUserId: string | null = null
supabase.auth.onAuthStateChange((event, session) => {
  const nextId = session?.user?.id ?? null
  if (nextId === lastUserId) return          // session restore = noop
  lastUserId = nextId
  queueMicrotask(() => {
    router.invalidate()
    queryClient.invalidateQueries()
  })
})
```

In `src/router.tsx`, set `new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, gcTime: 5*60_000, refetchOnWindowFocus: false } } })`.

## 6. Legacy iframe polling

- Gate the `setInterval(getSession, 1500)` loop in `src/pages/Landing.tsx` (or wherever it lives) behind `search?.legacy === '1'` and clear it once first sync succeeds.
- Once welcome is native, delete the 250ms click-bridge inject entirely (already covered by Step 1).

## Verification after implementation

- `bun run build` succeeds, `tsgo` clean.
- `curl http://localhost:8080/` returns HTML with landing hero text (not empty `<div id="root">`).
- Manual: `/welcome` renders sheet immediately, no iframe in devtools; email button triggers `signInWithOtp` (network tab); no console errors on `/`, `/stream`, `/welcome`.

## Rollback

Each step is isolated. If Step 3 SSR breaks a hook, flip `ssr:false` back on `/` only.

## Report

At end I'll report: bytes removed from client bundle (react-router-dom + react-helmet-async + iframe assets), first-paint HTML before/after for `/`.

---

Confirm and I'll execute. This is a substantial change touching ~20 files; expect it to take several turns and a build cycle.
