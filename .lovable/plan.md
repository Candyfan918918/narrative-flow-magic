
# Response Floor + Admin Console + Demo Purge

Schema prep (already applied this turn): `comments.is_companion` bool, `profiles.companion_seen_at` timestamptz, plus two indexes for companion lookups and the cold-room queue.

## 1. Companion in-thread comment
- **Extend** `upsertRoomForSituation` in `src/lib/situations.functions.ts` to accept an optional `companion_text`, and — after room creation — insert one comment with `is_companion=true`, `alias_id=<author>` (so the row is owner-writable under existing RLS), scrubbed via `runScrub`. Fail-soft.
- **Modify** `saveSituation` to generate the companion reflection via `runCompanion({mode:'felt_heard'})` for public spills/scans and pass it to the helper. Reuses existing agent — no prompt changes.
- **Update** `listRoomComments` return shape to expose `is_companion` and force `display_name="the companion"` + `emoji="👁"` on those rows; `is_mine=false`.
- **Update** `src/components/CommentsThread.tsx` to render companion comments with the eye avatar and a small "house AI" badge; skip edit/delete controls.
- **Pink-dot signal**: reuse the existing "due check-in" indicator on `CompanionBubble`. Add `getUnseenCompanionReply` server fn (compare newest own-room companion comment to `profiles.companion_seen_at`) and mark `companion_seen_at=now()` when the user opens the room. `CompanionBubble` ORs this with the check-in dot.

## 2. Resonance strip on the story page
- **SSR-render** in `src/routes/story.$pillar.$slug.tsx`: extend `getPublicStory` server fn to also return 3 matches from `findMatches` (falls back to same-pillar recent when empty). Render a strip: "N similar stories" (real N, honest floor rules) + 3 linked cards (title + first line + link to their `/story/...`). Same-pillar fallback when matcher returns none.

## 3. Admin console at `/admin`
- **Gate**: `has_role(auth.uid(),'admin')`. Anyone else → 404 via `notFound()`. `head()` emits `robots: noindex`. Excluded from sitemap.
- **Rebuild** `src/pages/Admin.tsx` from scratch (deletes the current 662-line mock). Three sections, real data via new server fns in `src/lib/admin.functions.ts`:
  - `adminNeedsResponse` → public rooms with 0 human relates AND 0 non-companion comments, oldest first
  - `adminNewRooms` → latest 50 public rooms
  - `adminLiquidityStats` → response coverage %, human-relate coverage (24h), cold-room count (>72h zero human), median time-to-first-human-relate
- **Notification**: new `notifyRoomCreated(roomId)` called at end of `upsertRoomForSituation` (fire-and-forget). Sends via `sendResendEmail` to `hello@shutap.com` with headline, first 200 chars, Scan score, room + admin links.

## 4. Post-read relate nudge
- **New component** `src/components/RelateNudge.tsx`: slide-up card triggered when user scrolls past 80% of a story. Fetches one cold-queue room via new `getColdNudge` server fn. One tap = relate. Session-guarded (`sessionStorage`). Suppressed when current room OR target is crisis-flagged.
- **Wire** into `src/routes/story.$pillar.$slug.tsx` (signed-in only via client check).

## 5. Honest reaction zero-state
- Edit `RoomDetail.tsx` reactions block: when total count is 0, render "be the first to feel this" instead of numeric zeros. Audit `RoomTile.tsx` for the same.

## 6. Demo data purge
- **Export first** — run a `SELECT ... WHERE is_seed=true` across the tables below and write a JSON archive to `/mnt/documents/shutap-demo-purge-<ts>.json` via `psql COPY`.
- **Tables to touch** (delete cascade order):
  1. `mirror_signals WHERE is_seed=true`
  2. `mirror_patterns WHERE is_demo=true`
  3. `checkin_responses` and `checkins` for seed situations
  4. `outcomes WHERE is_seed=true`
  5. `pii_scrub_log` for seed situations
  6. `comments WHERE room_id IN (seed rooms)`
  7. `room_reactions` and `room_relates` for seed rooms
  8. `rooms` created from seed situations
  9. `situations WHERE is_seed=true`
- Migration will run in one transaction. Nothing user-facing references seeds after — sitemap already excludes them; matcher excludes them.

## Open decision left for you
Whether seeds count toward the resonance "N people lived this" number. Current matcher already excludes seeds (`is_seed=false` in `match_situations` RPC), so post-purge this is moot — leaving as-is.

## Files
- Edit: `src/lib/situations.functions.ts`, `src/components/CommentsThread.tsx`, `src/components/CompanionBubble.tsx`, `src/lib/checkins.functions.ts` (or new `src/lib/companion-signals.functions.ts`), `src/routes/story.$pillar.$slug.tsx`, `src/lib/seo/story.server.ts`, `src/lib/story.functions.ts`, `src/components/RoomDetail.tsx`, `src/components/RoomTile.tsx`, `src/pages/Admin.tsx`, `src/lib/admin.functions.ts`, `src/routes/admin.tsx`
- Create: `src/components/RelateNudge.tsx`, `src/lib/notify.server.ts` (Resend wrapper for admin email)
- Migration: single purge migration + verification counts
- Export artifact: `/mnt/documents/shutap-demo-purge-<ts>.json`

## Not touched
- Spill/Scan agent prompts and state machines
- Mirror pipeline, billing, subscriptions
- `src/lib/email/designs/`, `src/lib/error-page.ts`, `public/email/`
- `src/integrations/supabase/*` generated files
