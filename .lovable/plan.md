# Build everything in #2 — the 5 missing spec items

The Spill v2 + content-ownership server layer is already in place (`saveSituation`, `updateSituation`, `composePost`, `aiEditPost`, comments CRUD, soft-delete). What's still not wired to real backend per the 0627 specs:

## 1. Adaptive AI Scan (replaces the static multi-choice)
**Server:** new `src/lib/agents/scan-turn.functions.ts` (`requireSupabaseAuth`).
- Persona in server-only `scan-persona.server.ts` — warm/funny friend, digs one layer deeper each card (event → feeling → feeling-under → fear/need/grief), greets by alias.
- One AI call per card via Lovable AI Gateway (`google/gemini-3-flash-preview`), strict JSON: either `{line, prompt, card:{type, ...}}` or terminal `{done:true, score:0-999, signature, read, factors[], pillar}`.
- Input types: `choice` / `multi` / `rate` / `spectrum` / `rank` / `text`. Server enforces no repeat type two turns in a row, ~5–8 cards soft cap. PII scrub + Crisis Guardian on every text input.
- Band logic 0-199 / 200-399 / 400-599 / 600-799 / 800-999.

**Client:** new `src/components/ScanRunner.tsx` rendering the 6 input widgets with indigo (`#7F77DD`) identity, SCAN wordmark, filling gauge. Mounted in a slide-up on Landing (replaces the existing static SCAN_Q path in `Shutap-0627.html` via postMessage bridge: `shutap-scan-turn` → parent → server fn → reply).

**Close = preview → destination** (same pattern as Spill): score + band + pillar chip + signature + read, then "post as room" or "keep private" → `saveSituation({kind:'scan', visibility, initial_scan, scan_band, body:read, …})` → redirect into the new room or `/profile#journal`.

## 2. Scan-as-room (public scan renders as a full room)
- `src/pages/Room.tsx`: when `situation.kind === 'scan' && visibility === 'public'`, render the score-header block above the normal room body (band-colored big number, band label, signature, pillar chip, "the read" prose). Reactions/relate/comments unchanged; relate label becomes "same number".
- Stream tile (in `Shutap-Stream.dc.html` injected `localStorage` merge): scans get a `SCAN` badge, pillar, band-colored score, signature. Extend the dynamic-tile injector to emit those fields.

## 3. Mirror memory engine (real per-user data)
- New `src/lib/mirror.functions.ts` (`requireSupabaseAuth`) `getMirrorPortrait()`: aggregates the caller's `situations` + `checkin_responses` into `{spill_count, scan_count, score_series:[{at,score}], trend:'easing'|'rising'|'steady', top_pillar, last_seen_at, first_seen_at, recent_themes[]}`. Trend = linear-regression slope over last 5 scan scores.
- New `src/pages/Mirror.tsx` route at `/mirror` (under `_authenticated/`):
  - "Still forming" empty state below 2 entries.
  - Real arc chart from `score_series` (lightweight inline SVG, no new dep).
  - Free preview vs paid full reading gated by existing `has_active_mirror` RPC; reuses Subscribe paywall.
- **Proactive surfacing:** Landing's eye companion (and the Stream header eye) checks `getMirrorPortrait` on mount; if `spill_count + scan_count >= 2` and `localStorage.shutap_mirror_dismissed_at` is >6h old, show a Newsreader-italic offer ("you keep circling back to {top_pillar}…"). Dismiss writes the timestamp; never permanent.
- **Always reachable:** "the mirror ✦" card on Landing under spill/scan, and a "the mirror ✦" item in the unified profile dropdown (built in §5).

## 4. Comment ownership UI
Server fns already exist (`createComment` / `updateComment` / `deleteComment`, scrubbed). Wire UI:
- `src/components/RoomDetail.tsx`: comment list shows alias + relative time; signed-in users get a composer; the author of each comment gets inline ✎ edit / 🗑 delete that calls the existing server fns and invalidates `['comments', roomId]`. Non-authors see the existing report menu.

## 5. Unified header + dropdown on every top-level page
- The `Header` component in `src/components/Header.tsx` is already correct; the problem is the four iframe-ported pages (Landing, Stream, Profile, AdminFeedback) each have their own header inside the static HTML.
- New `src/components/PageShell.tsx` that renders the React `Header` above the iframe (the iframe content gets a CSS rule injected via `?noheader=1` query that the existing HTMLs already honor via a tiny script we add: a `<style>` block that hides `.site-header, header.shutap-header` when `location.search.includes('noheader=1')`).
- Wrap `Landing.tsx`, `Stream.tsx`, `Profile.tsx`, `AdminFeedback.tsx`, `HallOfFame.tsx` in `PageShell`. Dropdown items per spec: **your profile · settings · spill it · the mirror ✦ · (admin) · sign out** — extend the existing `Header.tsx` dropdown to add "the mirror ✦" → `/mirror` and "settings" → `/profile#settings`. Admin item only when `has_role('admin')`.

## Build order (parallelizable in sub-batches)
1. Migration: ensure `situations.kind` allows `'scan'`, add `scan_signature`, `scan_read`, `scan_factors text[]` columns (additive, nullable).
2. Sub-batch A (Scan): scan-turn server fn + persona + ScanRunner component + Landing postMessage wiring.
3. Sub-batch B (Mirror): mirror server fn + `/mirror` route + proactive prompt + Header dropdown item.
4. Sub-batch C (Scan-as-room + Stream tile): Room.tsx score header + Stream tile injector.
5. Sub-batch D (Comments UI in RoomDetail).
6. Sub-batch E (Unified header via PageShell + iframe `?noheader=1` CSS).

## Out of scope (acknowledged)
- Real Resend email cadence for check-ins (scheduling RPC already exists; dispatcher is its own batch).
- Web push.
- Hard purge cron for soft-deleted situations after 7 days.
- AI persona retraining beyond persona-prompt edits.

## Technical notes
- All AI calls go through existing `/api/complete` Lovable AI Gateway route.
- New server fns: `requireSupabaseAuth`, files end in `.functions.ts`, server-only persona/prompts in `.server.ts` and loaded inside `.handler()` only.
- No new packages. Charts are inline SVG.
- TanStack Query keys: `['mirror','me']`, `['comments', roomId]`, `['situation', id]`.
