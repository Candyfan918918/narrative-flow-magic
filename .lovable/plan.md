## Why the homepage still shows "join"

`GlobalHeader` correctly swaps to a profile chip when signed in — but on `/` it suppresses itself (`isHome`) and the homepage ships its own hard-coded header at `src/pages/home/sections/Header.tsx`. That header renders a static `<a href="/welcome">join →</a>` pill with no auth check, so it says "join" for everyone regardless of session state.

## Fix

Make the homepage header's right-side CTA auth-aware, mirroring `GlobalHeader`.

### Changes

1. **`src/pages/home/sections/Header.tsx`**
   - Import `useCurrentAlias` from `@/hooks/use-current-alias` and `useState`/`useEffect` from React.
   - Replace the static `<a data-link="/welcome">join →</a>` element with a small local `HomeHeaderCta` component:
     - Reads `alias` from `useCurrentAlias()`. Also tracks a `ready` flag: on mount, call `supabase.auth.getSession()` and set `ready = true` once it resolves, so we don't flash "join" for a signed-in user during the SSR→client handoff (matches the guidance in `useAuthReady`).
     - While `!ready`: render an invisible placeholder pill (same width/height ≈ 72×34) so header spacing doesn't jump.
     - When `ready && alias`: render the profile chip — round gradient avatar with `alias.emoji` and the alias name — wrapped in a `<Link to="/profile">` (also add `data-link="/profile"` so the immersive mount's SPA nav handler picks it up).
     - Otherwise: keep the existing "join →" pill, unchanged.
   - Keep the surrounding `<nav>` and the `rooms` / `halls` links intact.

2. No other files change. `useCurrentAlias` already subscribes to `onAuthStateChange` and refreshes on `SIGNED_IN` / `SIGNED_OUT`, so signing in on another tab or completing OAuth updates the pill live.

### Notes / out of scope

- No dropdown menu on the homepage chip — clicking it just navigates to `/profile`. The full "spill / mirror / admin / sign out" menu remains on the global header used by every other route.
- No changes to auth, sessions, or OAuth flow — this is purely a UI read of the existing session.
- No styling changes to the pill/chip beyond matching the existing GlobalHeader look (gradient avatar + italic Newsreader name).
