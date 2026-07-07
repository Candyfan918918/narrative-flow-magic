## Problem

Clicking the "Spill it" (and "Scan it") CTAs on `/` feels like nothing happens — the user clicked three times before anything visible occurred. Two things combine:

1. The click handler `await`s `supabase.auth.getSession()` before doing anything visible, then calls `router.navigate({ to: '/welcome' })`. No visual feedback is given during that gap.
2. `/welcome` is `ssr:false` and heavy. The preload only starts inside a `useEffect` after hydration, so if the user clicks before hydration + preload finishes, the browser still has to download and parse the chunk on click.

Net effect: on cold hits the button appears dead for ~1–2s.

## Fix

Keep this UI/frontend-only. No backend changes.

1. **Preload `/welcome` earlier and more aggressively** in `src/pages/landing/LandingPage.tsx`:
   - Fire `router.preloadRoute({ to: '/welcome' })` immediately on mount (already done) AND on `pointerenter` / `focus` of each Spill/Scan CTA (button + the inline `spill it` / `scan it` prose links). Hover/focus preload is a well-worn TanStack pattern and cuts the last mile of latency.

2. **Give instant click feedback** in the CTA button handlers:
   - Add a `pendingCta: 'spill' | 'scan' | null` state.
   - In `openSpill` / `openScan`, set `pendingCta` synchronously BEFORE the `await requireRealUser(...)` call, and clear it in a `finally`.
   - While `pendingCta` matches, render the button in a "…" / dim + disabled state so the click is visibly registered even if navigation takes a beat.

3. **Remove the awaited round-trip for the common anonymous case** by adding a tiny cached-session helper next to `requireRealUser` in `src/lib/auth-guard.ts`:
   - Cache the last known `{ hasRealUser: boolean }` in a module-level variable, populated on first `getSession()` and refreshed by a single `supabase.auth.onAuthStateChange` subscription set up on module import (browser-only).
   - `requireRealUser` first checks the cache: if we already know the user is anonymous/missing, it saves the intent and calls `router.navigate({ to: '/welcome' })` synchronously — no `await`. If the cache is empty (first call), it falls back to today's `await getSession()` path.
   - This makes the second and subsequent CTA clicks instant, and the first click still gets the visual pending state from step 2.

4. **No changes** to `/welcome`, the auth flow, cron jobs, or any server function. Modal open logic for real signed-in users is unchanged.

## Files touched

- `src/pages/landing/LandingPage.tsx` — add `pendingCta` state, wire `onPointerEnter` / `onFocus` preloading on Spill/Scan buttons and prose links, show pending state.
- `src/lib/auth-guard.ts` — add cached session state + `onAuthStateChange` subscription; make `requireRealUser` synchronous when the cache says the user is anonymous.

## Verification

- Load `/`, wait for hydration, click "Spill it": button visibly enters pending state, `/welcome` opens with no perceptible download delay.
- Hard reload `/`, click "Spill it" immediately (before hydration effect could preload): pending state appears on click; navigation still completes.
- Signed-in real user: clicking "Spill it" still opens the `SpillModal` (no regression).
