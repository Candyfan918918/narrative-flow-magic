## Problem

Client-side navigation `/` → `/welcome` still feels laggy on cold hits because the `/welcome` route chunk is large. `WelcomeNative.tsx` (~567 lines) statically imports server-fn modules used only in later ceremony steps (`recordLegalAcceptance`, `upsertMyAlias`, `randomAliasParts`, `getMyAlias`, `sendWelcomeEmail`), so all of that ships in the initial chunk even though a fresh visitor only ever sees the "auth" step first.

SSR is intentionally NOT being flipped in this change — client-side `router.navigate` renders from already-loaded JS, so SSR wouldn't affect the click path, and prior measurement showed SSR added ~200ms TTFB on the direct-load path. That decision is deferred until the `cf-cache-status` check on the published site.

## Fix (frontend-only, no backend changes, no SSR change)

1. **Split `WelcomeNative` by step.** Extract each ceremony step into its own module so later steps become separate chunks fetched only when reached:
   - `src/pages/welcome/AuthStep.tsx` — signed-out UI (Google, Apple, email). Only imports `supabase` and `lovable`. Eagerly imported.
   - `src/pages/welcome/AgeStep.tsx` — 18+ gate + `recordLegalAcceptance` server-fn import. Lazy.
   - `src/pages/welcome/AliasStep.tsx` — alias mint / re-roll + `upsertMyAlias`, `randomAliasParts`, `getMyAlias`, `sendWelcomeEmail`. Lazy.
   - `src/pages/welcome/WelcomeEnterStep.tsx` — final "enter" screen. Lazy.
   - `WelcomeNative.tsx` becomes a thin orchestrator that owns `step`, shared state (email, dob, alias parts, etc.), and renders each step via `React.lazy` + `<Suspense fallback={…lightweight skeleton…}>`.

   Effect: initial `/welcome` chunk drops to the auth-step surface + four `import(...)` stubs. `alias`, `legal`, `welcome-email` chunks are fetched only after the user actually signs in and advances.

2. **Keep the previous turn's polish unchanged**: `router.preloadRoute('/welcome')` on landing-page mount + `onPointerEnter`/`onFocus` on the Spill/Scan CTAs, plus the "opening…" pending state and the cached `requireRealUser` fast path. These become more effective with a smaller initial chunk.

3. **Do NOT change `ssr: false` on `/welcome`.** That call is deferred until the `cf-cache-status` measurement on the published site.

## Files touched

- `src/pages/WelcomeNative.tsx` — reduced to orchestrator: `step` state + shared step props + `Suspense` + `React.lazy` per step. `AuthStep` eagerly imported so first paint doesn't Suspense.
- New: `src/pages/welcome/AuthStep.tsx`, `AgeStep.tsx`, `AliasStep.tsx`, `WelcomeEnterStep.tsx` — one per step; each owns its previously-inline UI and its own server-fn imports.
- No changes to `src/routes/welcome.tsx`, routes, cron, server functions, or auth flow.

## Verification

- Network panel on a hard-reload of `/` then Spill click: initial `/welcome` route chunk is materially smaller than before; `alias`/`legal`/`welcome-email` chunks only appear after the user signs in.
- Ceremony flow (auth → age → alias → welcome) still works end-to-end, including alias persistence and welcome-email send.
- Signed-in real user Spill flow (opens `SpillModal` directly on the landing page) still works — no regression.
- No visible flash between step transitions (Suspense fallback matches the page background / step scaffold).
