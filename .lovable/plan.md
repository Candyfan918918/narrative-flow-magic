# Response Floor + Admin Console — Build Plan

## 1. Companion comment in-thread

**Where**: `src/lib/agents/spill.functions.ts` (after step 6 where `companion` reflection is generated, only when `data.is_public && sit?.id && !isSeed`).

- Insert a row into `public.comments` via `supabaseAdmin` with:
  - `situation_id = sit.id`
  - `author_id = null` (new column) OR a reserved sentinel UUID stored in a new `is_companion boolean` column — **propose `is_companion boolean not null default false`** on `comments` (simpler, avoids nullable FK migration).
  - `clean_text = companion.message` (already scrubber-safe because the model wrote it from scrubbed input; still run through `scrubPII` for defense-in-depth).
- Extend `listRoomComments` in `src/lib/situations.functions.ts` to return `is_companion`, and override `display_name = 'the companion'`, `emoji = '👁'`, and never mark as `is_mine`.
- `src/components/CommentsThread.tsx`: render companion comments with the `EyeMark` avatar, name "the companion," and a small pill badge "house AI." Skip edit/delete controls.
- **Pink dot on companion bubble**: reuse the existing check-in-due indicator. Extend `getDueCheckin` (`src/lib/checkins.functions.ts`) OR add a sibling server fn `hasUnseenCompanionResponse` that returns true when the author has any public situation whose companion comment `created_at > profiles.companion_seen_at`. Add `companion_seen_at timestamptz` on `profiles`; clear it when the author views their own room. `CompanionBubble.tsx` ORs both signals to show the dot.

**Not touched**: private/journal (`is_public=false`) path skips insert. Scan-only rooms (from ScanModal) also get the companion comment when they hit `publishScanRoom` — audit that call site and mirror the insert there too.

## 2. Resonance strip on room page (SSR)

**Where**: `src/routes/room.tsx` currently uses `ssr: false` + client `RoomPage` reading localStorage. This must change for public rooms only.

- Convert `/room` route: keep `ssr: false` for local-only rooms (from localStorage) but add a new SSR-capable route `/story/$pillar/$slug` (already exists) as the canonical public room URL. If the request is `?id=<uuid>`, keep the current client behavior. **The public canonical is `/story/...`** — that's where the SSR resonance strip belongs.
- `src/routes/story.$pillar.$slug.tsx`: in the loader, call `findMatches` server-side with the story's `clean_text` + `pillar`, `exclude_id = story.id`. Pass top 2–3 into the component.
- Render a `ResonanceStrip` component above the CTA: shows "N similar stories" (only when `display_count >= 5`; else the story-line copy) and 2–3 `<Link to="/story/$pillar/$slug">` cards.
- Fallback: when matcher returns zero, query `supabaseAdmin.from('situations').select(...).eq('pillar', pillar).eq('is_public', true).eq('is_seed', false).eq('crisis_flag', false).neq('id', story.id).order('created_at', desc).limit(3)`.
- New helper file: `src/components/story/ResonanceStrip.tsx`.

## 3. Admin console at `/admin`

**Admin gating mechanism**: use the existing `user_roles` table + `has_role(uid, 'admin')` (already wired in `src/lib/admin.functions.ts`). Propose: grant the admin role to the owner account via a one-off migration seed keyed on the account's `auth.users.email` lookup (looked up server-side; email not hard-coded in client). If the admin account is unknown at migration time, the plan will emit a placeholder migration and I'll ask for the email before running it.

- Rewrite `src/pages/Admin.tsx`: strip out the mock KPIs, spark charts, and seed-based content. Replace with three sections backed by real server fns.
- Move route to `src/routes/_authenticated/admin.tsx` (subtree already gates auth). Add an in-route `beforeLoad` that calls a new `getIsAdmin` server fn (uses `has_role`), throws `notFound()` on false → true 404 for non-admins. Keep `robots: noindex`. Ensure the sitemap builders (`src/routes/sitemap[.]xml.ts`, etc.) don't list `/admin`.
- Remove the old `src/routes/admin.tsx` (top-level, ssr:false) after moving.
- New server functions in `src/lib/admin.functions.ts`, each wrapping `requireAdmin` middleware:
  - `adminNeedsResponse` — public, non-seed, non-crisis situations with zero non-companion, non-author comments AND zero human relates; ordered oldest first.
  - `adminNewRooms` — reverse-chronological latest public rooms with the same column set.
  - `adminLiquidityStats` — response coverage %, human-relate coverage % (24h window), cold-room count (>72h zero human engagement), avg time-to-first-human-relate. Real computed numbers; expose `{ value, sample_size }` so honest zeros surface.
- Sections render as tables with columns: headline (deriveTitle), age (relative), pillar, Scan score, comment count (excluding companion), relate count, deep link `/story/$pillar/$slug`.

**Notification layer**: on public room creation (end of `runSpill` when `is_public && !isSeed && !crisis`), fire an internal call to `src/lib/email/send.server.ts` (or `sendResendEmail`) with To: `hello@shutap.com`, Subject: `[new room] <headline>`, body: headline + first 200 chars of `clean_text` + Scan score + links to `/story/...` and `/_authenticated/admin`. Fail-soft (log, never throw). Use the existing `IDENTITIES` from `src/lib/email/identities.ts`.

## 4. Post-read relate nudge

**Where**: `src/components/RoomDetail.tsx` (and the story page component). Only for signed-in users, non-crisis current room.

- New server fn `getColdRoomNudge` in `src/lib/relate-queue.functions.ts`: returns one public, non-seed, non-crisis room with zero human relates and age > 24h, excluding current id, excluding rooms the caller already interacted with. Uses `supabaseAdmin` filtered by criteria.
- New `<ColdRelateNudge>` component: same slide-up pattern as `RoomShareSheet`. Shows headline + first sentence + two actions ("omg same" relate + "open room" link).
- Trigger: `IntersectionObserver` on the bottom of the room body. Session cap via `sessionStorage['cold_relate_shown']`. Skip entirely if `room.crisis_flag` or nudge target `crisis_flag`.
- On "omg same": call existing relate mutation with the nudge target id. Suppress once fired.
- Tracking events: `cold_relate_nudge_shown` and `cold_relate_nudge_accepted` via existing `trackEvent` in `src/lib/tracking.ts`.

## 5. Honest reaction states

- Audit `src/components/RoomDetail.tsx`, `src/components/RoomTile.tsx`, `src/pages/Stream.tsx` for any hard-coded reaction default `>0`. Fix zero-state copy: "be the first to feel this."
- `src/data/seed.ts` still ships mock `reactions: { heard: 3, same: 2, ... }` used by `RoomPage` (localStorage) — after the demo purge (§6) this file's SHUTAP_SEED must be neutered to `{ rooms: [] }` (retain type export). Any component relying on `SHUTAP_SEED.rooms` for non-empty demo data must render honest empty states.

## 6. Demo data purge

**Tables to touch** (list per constraint):

- `public.situations` — delete `is_seed = true`
- `public.comments` — delete rows whose `situation_id` is in the deleted set OR flagged demo
- `public.room_reactions` — same cascade
- `public.room_relates` — same cascade
- `public.rooms` — legacy table, delete demo rows
- `public.mirror_signals` — delete `is_seed = true`
- `public.mirror_patterns` — delete `is_demo = true`
- `public.mirror_shape` — recompute after deletion
- `public.checkins`, `public.checkin_responses`, `public.outcomes` — cascade via `situation_id` of deleted situations
- `public.pii_scrub_log` — cascade
- `public.pillar_status` — recompute counts
- Client-side: `localStorage['shutap_user_situations']`, `localStorage['shutap_modqueue']`, `SHUTAP_SEED` in `src/data/seed.ts`

**Export first**: new admin server fn `adminExportDemoData` that streams a single JSON blob with all `is_seed`/`is_demo` rows across the tables above, plus any rows sourced from `invented_stories.json` (if that file still exists in the repo, include a snapshot; the plan will grep and confirm before deletion). Downloadable from the admin console → "Export & purge demo data" button → hits `adminPurgeDemoData` which runs the DELETEs in a transaction after the export succeeds.

**Verification** (after purge):
- Hall of Fame page counts source real rows only (audit `src/pages/Halls.tsx`).
- Pillar densities via `pillar_status` — trigger recompute or verify it excludes seeds.
- Matcher already excludes seeds (confirmed in `match_situations` RPC).
- Resonance strip counts, stream feed, admin liquidity — all real.

## Migrations required

1. `alter table public.comments add column is_companion boolean not null default false;` + RLS: allow admin inserts via `supabaseAdmin` (bypasses RLS anyway); update SELECT policies to keep companion comments readable by everyone who can read the situation.
2. `alter table public.profiles add column companion_seen_at timestamptz;`
3. Seed admin role for the owner account (needs user email — will ask before running).

## Files to change / create

**Modify**:
- `src/lib/agents/spill.functions.ts` — insert companion comment, fire admin email
- `src/lib/situations.functions.ts` — expose `is_companion`, `publishScanRoom` companion comment
- `src/components/CommentsThread.tsx` — companion rendering
- `src/components/CompanionBubble.tsx` — OR unseen-companion signal into pink dot
- `src/lib/checkins.functions.ts` or new `src/lib/companion-inbox.functions.ts`
- `src/routes/story.$pillar.$slug.tsx` — SSR resonance strip in loader
- `src/components/RoomDetail.tsx` — cold-relate nudge, honest zero-states
- `src/pages/Admin.tsx` — full rewrite: real data tables
- `src/lib/admin.functions.ts` — new server fns
- `src/lib/relate-queue.functions.ts` — cold nudge picker
- `src/data/seed.ts` — empty rooms array
- `src/pages/Stream.tsx`, `src/components/RoomTile.tsx` — audit reaction defaults
- `src/routes/admin.tsx` → move to `src/routes/_authenticated/admin.tsx`

**Create**:
- `src/components/story/ResonanceStrip.tsx`
- `src/components/ColdRelateNudge.tsx`
- Migration files for `comments.is_companion`, `profiles.companion_seen_at`, admin role seed

## Constraints honored
- No Spill/Scan agent logic, Mirror, or billing prompts change
- New comment/relate writes reuse existing `scrubPII` + crisis-guard paths
- Companion comment goes through PII scrubber for defense-in-depth
- Admin route: 404 for non-admins, noindex, absent from sitemap
- All new counts computed from real (non-seed) data

## Open questions (need answer before build)
1. **Admin account email** to seed `user_roles` for `has_role('admin')`.
2. Should the SSR resonance strip live on `/room?id=<uuid>` (client route) too, or only on `/story/$pillar/$slug`? The spec says "on the room page" — I read that as the canonical public URL (`/story`), which is what crawlers see. Confirm.
3. Cold-room threshold in the admin — spec says >72h zero *human* engagement; confirm that "human engagement" = human relates only (not companion comments, not scans).
