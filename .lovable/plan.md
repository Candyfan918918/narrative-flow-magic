## What's actually happening on refresh

The home route is the slowest path in the app and the "two huge broken eyes" you see for a beat are an unstyled-SVG flash from the iframe. Three things stack up on every reload of `/`:

1. **No SSR HTML for `/`.** `src/routes/index.tsx` is `ssr: false` and renders `SpaShell` (BrowserRouter + the whole react-router app). The server returns a near-empty shell, so the browser waits for the full JS bundle to download + hydrate before anything appears. That's the "long blank, then snap" feel.
2. **The iframe is the real page.** Once React mounts, `LandingPage` mounts an `<iframe src="/shutap/Shutap-Landing.dc.html">`. That file ships a base64-gzipped bundle (`support.js` decompresses it at runtime) plus Google Fonts. Until the bundle's stylesheet is parsed, every inline `<svg viewBox="0 0 140 96">` (the eye mascot, used twice at the top of the landing) has no width/height attribute — browsers fall back to the SVG default of **300×150 each**, so you literally see two giant eyes for ~200–600ms before the bundle's CSS sizes them down to ~52×37. That's the "2 broken big eyes."
3. **Anonymous Supabase sign-in is on the boot path.** `__root.tsx` calls `supabase.auth.signInAnonymously()` inside the first effect for any visitor without a session. On a cold refresh that's an extra round trip to auth before the app is interactive (you can see the refresh-token POST in the network log right at T+0).

A secondary contributor: the Google Fonts `<link rel="stylesheet">` in `__root.tsx` is render-blocking and `Newsreader` italic is the body font in the iframe too, so there's a second FOUT layered on top.

## Fix plan (scoped, no behavior change)

### 1. Kill the giant-eye flash (root cause: missing intrinsic size on SVG)
- In every eye mascot occurrence inside the dc.html files served from `public/shutap/` (`Shutap-Landing.dc.html`, `Welcome.dc.html`, `Shutap-Stream.dc.html`, `Shutap-Profile.dc.html`, `Room.dc.html`, `HallOfFame.dc.html`, etc.), add explicit `width` and `height` attributes on the `<svg>` tag itself (e.g. `<svg width="52" height="37" viewBox="0 0 140 96">`). The wrapping `<span>` already has the pixel size — adding it to the SVG too means the browser uses it as the intrinsic size before any CSS loads, eliminating the 300×150 default.
- Do the same in `src/components/EyeDefs.tsx` for `EyeMascot` (set `width={w} height={h}` on the `<svg>`, not just on the wrapping span) and in `eyeSVG()` (prepend `width="…" height="…"` to the serialized string).
- No visual change at steady state; only removes the unstyled flash.

### 2. Make the first paint immediate
- Render a small static skeleton (background color + centered eye-mascot at its real 52×37 size + the "shutap" wordmark) directly from `src/routes/index.tsx` `head().scripts`/component so something is on screen before the SPA bundle hydrates. Keep `ssr:false` on the SPA shell but ship the skeleton as inline HTML in the route component. The iframe still mounts on top once React is ready; the skeleton just fills the blank gap.
- Add `<link rel="preload" as="document" href="/shutap/Shutap-Landing.dc.html">` to the index route's `head().links` so the iframe document starts downloading in parallel with the SPA JS instead of after it.

### 3. Move anonymous sign-in off the critical path
- In `src/routes/__root.tsx`, wrap the `signInAnonymously()` call in `requestIdleCallback` (with a `setTimeout(…, 0)` fallback) so it runs after first paint instead of blocking the initial effect chain. Visitors who never hit a `requireSupabaseAuth` server fn on the landing page don't need the session before paint; the existing `pending-save` resume already waits for a session, so deferring is safe.

### 4. Font loading polish (small win, prevents a second flash)
- In `__root.tsx`, change the Google Fonts `<link>` from a render-blocking stylesheet to the standard `preload` → `onload="this.rel='stylesheet'"` swap pattern (using TanStack `head().links` with `rel:"preload"` + a tiny inline script, or just `media="print" onload="this.media='all'"`). Keep the same font families — only the loading strategy changes.

## Out of scope
- No changes to AI prompts, server functions, schemas, Mirror, comment composer, scan share card, or the iframe bridge protocol.
- No swap away from the iframe architecture — that's a much bigger surgery and not needed to fix what you're seeing.

## Acceptance
- Hard refresh on `/` shows the skeleton (background + correctly-sized eye + wordmark) within ~one frame, then the landing iframe fades in over it.
- No moment where the eye SVGs render at the unstyled 300×150 default size.
- Network panel on cold refresh shows the dc.html starting to load in parallel with the JS bundle, and the Supabase `/auth/v1/token` request fires after the first paint instead of before it.
- Dev build passes; no behavior change to spill/scan/persist/comments.
