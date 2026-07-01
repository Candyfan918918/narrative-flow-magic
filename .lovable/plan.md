
# Plan — Native React port of the landing page

## Why this is slow today
- `/` = `ssr:false` → SpaShell → BrowserRouter → `LandingPage` (`src/pages/Landing.tsx`) mounts an `<iframe src="/shutap/Landing.dc.html">`.
- That iframe is a 244 KB self-contained HTML doc that boots its **own** React 18 (`public/shutap/vendor/react*.js`) via a proprietary `support.js` "DCLogic" runtime (`<x-dc>` + `<script type="text/x-dc">`), then paints. So the user waits for: SPA JS → iframe HTML → iframe React → DCLogic → first paint.
- Google Fonts (Sora, Inter, Newsreader, Cormorant Garamond) load twice — once from `__root.tsx`, once inside the iframe head.

Removing the iframe removes: second React runtime, DCLogic bootstrap, duplicate font requests, and the cross-window bridge polling — plus lets SSR paint the first frame.

## Scope reality check (please read before approving)
`public/shutap/Landing.dc.html` is 2,436 lines (~244 KB): a full landing feed, animated companion mascot, hero, onboarding modal, spill modal (multi-turn chat), scan modal (multi-turn card quiz), mirror teaser, share sheet, plus ~40 CSS `@keyframes` and dozens of inline SVGs. Everything is authored against a custom `DCLogic` class — not React components — so this is a rewrite, not a translation. Two options:

- **Option A — Full pixel-perfect port in one go.** Largest and slowest to review; highest risk of regression.
- **Option B (recommended) — Staged port behind a flag.** Ship a native React `LandingShell` that owns the outer chrome + intent-hash + bridge behaviors first, and port sub-surfaces (feed, spill modal, scan modal, onboarding, share sheet) in follow-up passes, gated by a `?legacy=1` escape hatch that still renders the iframe for A/B comparison during the port. Same final destination, safer landings.

The steps below describe **Option B**. Say the word and I'll collapse to Option A instead.

## Files created

- `src/pages/landing/LandingPage.tsx` — new top-level component (replaces the iframe in `src/pages/Landing.tsx`). Owns:
  - intent-hash cover (`#spill|#scan|#ask|#mirror`)
  - pending-save resume after sign-in
  - the shared `SYNCED_KEY` sync helpers (moved out of iframe polling; no longer needed once iframe is gone, but kept to reconcile any legacy `localStorage` entries)
  - `useServerFn(runSpill / saveSituation / updateSituation)` — unchanged
- `src/pages/landing/sections/*.tsx` — one file per band on the current page:
  - `HeroSection.tsx`, `CompanionMascot.tsx`, `OnboardingModal.tsx` ("this is where you're heard"), `FeedPreviewSection.tsx`, `MirrorTeaserSection.tsx`, `Footer.tsx`.
- `src/pages/landing/modals/SpillModal.tsx`, `ScanModal.tsx`, `ShareSheet.tsx` — React ports of the DCLogic modals. Each calls the same `/api/complete` gateway directly (no `window.claude` shim needed once we're same-window).
- `src/pages/landing/landing.module.css` — lifts the CSS + `@keyframes` block from `Landing.dc.html` verbatim so animations survive.
- `src/pages/landing/data/rooms.ts`, `scan.ts`, `aliases.ts`, `onboarding.ts` — the `ROOMS`, `SCAN_Q`, `SIGS`, `ALIAS_PARTS`, `ONB` literals lifted straight out of the DCLogic class.
- `src/pages/landing/lib/ai.ts` — the `SPILL_SYSTEM` / `SCAN_SYSTEM` prompts + `complete()` / `stream()` helpers, moved out of `Landing.tsx` unchanged. **No AI logic, model, or server function is touched** (requirement 5).

## Files changed

- `src/pages/Landing.tsx` → becomes a 5-line re-export of `LandingPage` (kept for import-path stability), and drops the iframe/postMessage/`window.claude` code once every sub-surface is ported. During the staged port, it renders `<LandingPage />` by default and `<LegacyIframeLanding />` when `?legacy=1` is present so we can side-by-side compare.
- `src/routes/index.tsx`:
  - remove `ssr: false` (see risk assessment below)
  - drop the `<link rel="preload" as="document" href="/shutap/Landing.dc.html">` — no iframe doc to warm
  - keep the JSON-LD + head metadata
- `src/routes/__root.tsx` — **no font change** (this is the single source of truth). The duplicate `<link>` in `Landing.dc.html` disappears when the iframe is gone (requirement 4 satisfied). Cormorant Garamond is already in the root font stylesheet, so no additions.
- `src/components/SpaShell.tsx` — untouched; still hosts the `BrowserRouter` for the rest of the SPA (Stream/Profile/Room/Mirror etc.). `LandingPage` continues to use `useNavigate` from `react-router-dom` so intra-SPA nav still works.
- **Not touched:** `public/shutap/Landing.dc.html`, `public/shutap/vendor/*`, `public/shutap/support.js`, `public/shutap/bundle/*` — kept on disk for comparison and easy revert (requirement 6).

## Behavior preservation checklist (requirement 2)

| Behavior today (iframe bridge) | Behavior in React port |
|---|---|
| Spill flow: bundle → `window.claude.complete` → `/api/complete` | `SpillModal` calls `fetch('/api/complete', …)` directly with the same `SPILL_SYSTEM` prompt + body shape. |
| Scan flow: same as spill | `ScanModal` — same, with `SCAN_SYSTEM`. |
| Mirror CTA click bridge (DOM walker inside iframe) | Native `<Link to="/mirror">` on the mirror CTA button. |
| `shutap-subscribe` postMessage | Direct `navigate('/subscribe?plan=…')` from the CTA. |
| `shutap-manage-sub` postMessage | Direct `navigate('/profile')`. |
| `shutap-persist-situation` postMessage + `SYNCED_KEY` stamping | React `useMutation` calling `saveSituation` server fn; same `SYNCED_KEY` stamping preserved for backwards compat with any Stream/Profile code that keys off it. |
| `shutap-update-situation` postMessage | React path calling `updateSituation`. |
| Poll loop reading iframe `localStorage['shutap_situations']` | Removed — state now lives in React and writes directly. A one-time migration on mount drains any legacy `shutap_situations` entries left in top-window `localStorage` into Supabase using the existing `saveSituation` call, then clears them. |
| Pending-save resume after sign-in (`shutap_pending_save`) | Kept verbatim in `LandingPage` mount effect. |
| Intent hash handling `/#spill /#scan /#ask /#mirror` + `history.replaceState` cleanup | React `useEffect` reads `location.hash`, opens the matching modal (or navigates to `/mirror`), then `history.replaceState` to strip it. |
| Intent cover flash-guard (`#fdf0f5` overlay) | Kept as a React overlay while the target modal mounts. |

## Visual parity guarantee (requirement 1)

1. Lift the full `<style>` block from `Landing.dc.html` verbatim into `landing.module.css` (scoped) so every animation, gradient, radius, and shadow matches by construction.
2. Port the DOM section-by-section, copying inline styles as-is; use the same class names so the CSS keeps applying.
3. Copy runs 1:1 from the source (headings, onboarding rows, room seed strings, scan questions, verdict labels).
4. Verification pass per section:
   - Playwright screenshot both `/` (new) and `/?legacy=1` (old iframe) at 1280×1800 and 390×844.
   - Visual diff. Land the section only when the diff is within antialiasing noise.
   - Manually walk: open onboarding modal, run a spill turn, run a scan to completion, tap mirror CTA, tap subscribe, hit `/#spill` directly.

## Requirement 3 — SSR risk assessment

Removing `ssr: false` on `/` is safe **only** if the landing tree renders with no browser globals at module scope. Concrete risks and mitigations:

- `SpaShell` wraps in `BrowserRouter` (react-router-dom). `BrowserRouter` touches `window.history` on construction → will crash under SSR. **Mitigation:** keep `SpaShell` client-only. Two viable shapes:
  - (a) Keep `ssr: false` on `/` and accept that we still get the win — a native React landing without an iframe is already dramatically faster even client-rendered, because we cut out the second React boot + DCLogic + font duplication. This is the low-risk default.
  - (b) Move `LandingPage` out from under `SpaShell` on the `/` route only (render it directly from the TanStack route), and re-enable SSR. Intra-SPA nav from the landing then uses TanStack `Link`/`useNavigate` instead of react-router-dom. Bigger blast radius, but unlocks true SSR first paint.
- Recommendation: ship **(a) first** (removes the iframe, keeps `ssr: false`), then evaluate (b) as a follow-up once we can measure the remaining gap. I'll call out (b) explicitly before doing it.
- Either way, no `window` / `document` / `localStorage` access at module scope in the new files — all such reads live inside `useEffect` or event handlers.

## Requirement 4 — font de-duplication

Once the iframe is gone, `__root.tsx` is the only place Google Fonts are requested. Cormorant Garamond is already in that `<link>` (verified). No changes needed to `__root.tsx`; the win falls out of removing the iframe.

## Perf expectations

- Cold refresh drops from "two React boots + 244 KB HTML + 24 woff2 twice" to "one React boot + fonts once".
- Preload of the heavy iframe doc goes away (requirement: removed from `src/routes/index.tsx`).
- Expected first-contentful-paint on `/` refresh: sub-second on warm cache, since it's now the same shell that already serves `/stream` fast.

## Regression risks to watch

- **Modal parity.** Spill and Scan modals are the most complex ports (multi-turn state machines, streaming UI). Highest chance of subtle behavior drift — the section-by-section screenshot diffing is specifically to catch this.
- **Intent-hash race.** In the iframe world, we had to poke the child window's `location.hash` because the child had its own URL. In React we open the modal directly on mount from the parent hash — simpler, but any consumer that expected the old bridge messages will break. None found in a scan of the codebase, but calling it out.
- **`window.claude` consumers.** Only the iframe used it. Removing it is safe once the iframe is gone; during the staged rollout the legacy iframe path keeps its injection intact.
- **CSS collisions.** The lifted `<style>` uses generic class names (`.m-cards`, `.m-rd`, `.sc-eye`, …). Scoping via CSS Modules eliminates any bleed into the rest of the SPA.
- **SEO.** All `head()` metadata + JSON-LD stay on `src/routes/__root.tsx` and `src/routes/index.tsx` — unchanged.
- **Kept-on-disk legacy files** (`Landing.dc.html`, `vendor/*`, `support.js`, `bundle/*`) are no longer referenced from the app after the port. They stay for one release for comparison, then can be deleted in a follow-up.

## Rollout order

1. Scaffold `src/pages/landing/` with `LandingPage`, `landing.module.css` (styles lifted), data files, and a first-cut hero + footer only. Behind `?legacy=1` fallback.
2. Port `OnboardingModal` + `CompanionMascot`.
3. Port `FeedPreviewSection` (uses `ROOMS`).
4. Port `SpillModal` (highest risk; screenshot + interaction diff before merging).
5. Port `ScanModal` (same).
6. Port `MirrorTeaserSection` + `ShareSheet`.
7. Flip `src/routes/index.tsx` preload link, remove iframe path from `src/pages/Landing.tsx`, keep `ssr:false` (SSR option (b) as separate follow-up).
8. Verify: Playwright screenshot diff + manual walk of every listed behavior. Only then consider deleting the on-disk legacy files.

## Out of scope

- No changes to AI models, prompts (beyond moving `SPILL_SYSTEM` / `SCAN_SYSTEM` to a new file verbatim), server functions, or Supabase schema (requirement 5).
- No touch to Stream / Profile / Room / Mirror pages.
- No deletion of legacy files (requirement 6).
