# Why the homepage refresh is slow

I traced the load path. The bottleneck on `/` refresh is the landing iframe document, not the React shell or backend.

## What's actually slow

1. **The iframe loads a 3.7 MB self-contained file.**
   `src/pages/Landing.tsx` sets the iframe `src` to `/shutap/Shutap-Landing.dc.html` (**3,727,214 bytes**). That file is a base64-packed bundle (~57 base64/`atob` references) that the browser must download, parse, base64-decode in JS, then unpack into a fresh `documentElement` before anything paints. Even on a fast connection that's hundreds of ms of transfer + main-thread unpack.

2. **We also `<link rel="preload" as="document">` that same 3.7 MB file** from `src/routes/index.tsx`. So even before the iframe is created, the browser begins downloading the heavy bundle — competing with the React JS bundle for bandwidth on a cold refresh.

3. **The lighter streaming alternative is already on disk and wired**, but unused.
   `public/shutap/Landing.dc.html` is **243 KB** (≈15× smaller), streams progressively via `support.js`, and `public/shutap/vendor/{react,react-dom}.production.min.js` is already vendored so it skips the unpkg CDN fetch. We previously switched to it, then a later change reverted to the heavy bundle.

4. **Minor secondary costs** (each ~tens-of-ms, not the main issue):
   - Anonymous Supabase `getSession`/`signInAnonymously` runs on every load (already deferred to `requestIdleCallback`, so not on the critical path — leaving as-is).
   - `Mirror` route fires `listMirrorPatterns` + `listDemoPatterns` + 2× `runMirrorCrossRead` on mount, but only on `/mirror`. Not relevant to `/` refresh.

## Fix plan (3 small, surgical changes)

### 1. `src/pages/Landing.tsx`
Change the iframe `src` from `/shutap/Shutap-Landing.dc.html` to `/shutap/Landing.dc.html`. Same prototype, ~15× smaller, streams in instead of unpacking.

### 2. `src/routes/index.tsx`
Update the `<link rel="preload" as="document">` href to match — `/shutap/Landing.dc.html` — so we warm the right file. (Preloading the 3.7 MB file while loading the lighter one would waste bandwidth.)

### 3. Verify and clean up
- Confirm in the Network tab on refresh: only `Landing.dc.html` (~244 KB) is requested, no `Shutap-Landing.dc.html`, no `unpkg.com` (vendored React is already in place and `support.js` short-circuits when `window.React`/`ReactDOM` exist).
- Confirm `window.claude` injection, spill/scan modals, and hash-intent cover still work (the bridge code is iframe-agnostic).
- No splash flash: `Landing.dc.html` doesn't have the eye-logo splash that `Shutap-Landing.dc.html` did, so nothing extra to hide.

## What I will NOT change

- React shell, routing, auth bootstrap, server functions, Mirror, share sheet, or any UI/UX.
- The heavy `Shutap-Landing.dc.html` file stays on disk (other code paths or fallbacks may still reference it).

## Expected result

Refresh of `/` should drop from ~3 s to well under 1 s on a warm cache, and feel near-instant after the first visit, since the iframe document is now small and streams rather than unpacking a 3.7 MB base64 blob on the main thread.
