# Close the Claude / Lovable gap — port the four dynamic pages to real React

## Why

Today the four dynamic pages are Claude design HTMLs (`public/shutap/*.dc.html`) mounted in iframes. Visuals come from the HTML; behavior (auth, AI, persistence, scan-as-room, score cards) is bridged through `postMessage` to React/server fns. Every Claude design pass re-introduces drift; every behavior change has to be re-bridged. This plan eliminates the bridge.

After the port: design tokens, layout, and behavior all live in `src/`. Updating a Claude HTML becomes a *reference*, not the implementation. Scan-as-room, stream tiles, and share cards all share React components and update in one place.

## Scope

In: `Landing`, `Stream`, `Room`, `Profile`.
Out: `Welcome`, `Halls`, `Admin`, `Legal`, `HallOfFame` — stay iframe-bridged for now (low churn, low dynamism).

## Build order

### Step 1 — Design tokens
Extract the Claude HTML inline styles into `src/styles/tokens.css` (most already there) + a new `src/styles/components.css` for `.rtile`, `.react-btn`, `.menu-item`, `.prose-link`, keyframes (`breathe`, `fadeUp`, `eblink`, `thump`, `slideUp`, `pop`). Import into `src/styles/global.css`. No new deps.

### Step 2 — Shared chrome
- `src/components/SiteHeader.tsx` — the unified header with eye, brand, dropdown (profile/settings/spill it/the mirror ✦/admin/sign out). Replaces both the React `Header.tsx` and the inline HTML headers.
- `src/components/EyeCompanion.tsx` — floating eye + speech bubble, used by Landing & Stream.
- `src/components/CTAButton.tsx`, `src/components/SectionLabel.tsx` — primitives.
- `src/components/PageShell.tsx` — wraps the SiteHeader + page slot.

### Step 3 — Stream (smallest, validates the pattern)
- `src/pages/Stream.tsx` becomes a real React page: pulls rooms from Supabase (`situations` joined with reactions/relates counts), merges seed data, renders `<RoomTile>` grid.
- `src/components/RoomTile.tsx` — single tile component. Branches on `kind === 'scan'`: scan tiles render score card (band-colored big number, SCAN badge, pillar chip, signature) instead of body/reactions strip.
- Filters/sort/halls row → simple React state.
- Delete `public/shutap/Stream.dc.html` from the route (keep file as reference).

### Step 4 — Room
- `src/pages/Room.tsx` mounts existing `<RoomDetail>` with live data (already there — currently bypassed by iframe).
- `<RoomDetail>` gets a `<ScanScoreHeader>` block when `room.kind === 'scan'`: band-colored 3-digit score, band label, signature, pillar chip, "the read" prose, relate label switches to "same number".
- Delete the iframe shim.

### Step 5 — Share card
- Add `kind === 'scan'` artifact variant in `src/lib/share.ts` (mostly already there) and wire it from `<ScanScoreHeader>`'s share button so external shares render the score card.

### Step 6 — Profile
- `src/pages/Profile.tsx` already exists as real React — just wrap in `PageShell`, ensure scan entries render with mini score chip, delete the iframe shim.
- Tabs: spills · scans · journals · drafts.

### Step 7 — Landing (last; biggest)
- `src/pages/Landing.tsx` becomes the React hero: eye mascot, "spill it" / "scan" / "the mirror ✦" CTA cards, room previews row, eye companion, slide-up overlays.
- `src/components/SpillOverlay.tsx` and `src/components/ScanOverlay.tsx` mount the existing `ScanRunner` / Spill flow as real React (replace the bridged versions).
- Pending-save resume logic moves into `Landing.tsx` directly (no postMessage).

### Step 8 — Cleanup
- Remove `SpaShell`, `ScaffoldShell`, `ai-bridge.js` once nothing iframes them.
- Keep `public/shutap/*.dc.html` checked in as design references only; remove from the route table.

## Risk / mitigation
- **Visual drift during port** → port one page at a time; keep iframe live until React replacement renders 1:1, then flip the route.
- **Lost behavior** → audit each `postMessage` channel before deleting (`shutap_pending_save`, `auth-sheet`, share offers, feedback events).
- **Bundle size** → no new deps; existing tokens/CSS already present.

## Estimate
~2-3 hours of focused work. I'll ship in the order above and let you review after Stream (Step 3) before committing to the rest.

## After this plan
Every future Claude design = a visual reference I diff into the React components. No bridges. Scan-as-room, stream tile, and share card update in one place by default.
