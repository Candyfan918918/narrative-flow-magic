# Response Floor + Admin Console — Plan (updated)

Most of this build already landed in the previous turn. Below is what's done vs. what's still open, plus the remaining files to touch. Nothing here changes Spill/Scan agent logic, Mirror, or billing.

## Status snapshot

**Already shipped last turn**
- DB migration: `comments.is_companion`, `profiles.companion_seen_at`, cold-room + unseen-reply indexes.
- Companion comment auto-inserted as first comment on public room creation (via `saveSituation` → `upsertRoomForSituation`); scrubbed through the existing PII / crisis paths.
- `listRoomComments` server fn returns `is_companion` and forces display name "the companion" (never a user alias).
- `CommentsThread.tsx` renders the companion comment with eye avatar, "the companion" name, and "house AI" badge; edit/delete hidden for companion rows.
- Admin server fns: `adminNewRooms`, `adminNeedsResponse`, `adminLiquidityStats` — all gated by `has_role(auth.uid(), 'admin')`, real data only.
- Notification layer: `notify.server.ts` emails `hello@shutap.com` via Resend on public room creation (headline, ~200 char excerpt, Scan score, `/room?id=…` and `/admin` deep links).
- Resonance strip: `listResonanceMatches` (matcher first, same-pillar fallback), wired through `getPublicStory` and SSR-rendered on `/story/$pillar/$slug` with "N+ similar stories" or fallback line.
- Post-read `RelateNudge` component + `getColdNudge` server fn — session-guarded, suppressed on crisis rooms, one-tap relate.
- "Be the first to feel this" zero-state on room reactions.
- `/admin` page rebuilt with real KPIs (coverage %, 24h coverage, cold rooms >72h, median TTFR) and "Needs response" / "New rooms" tabs.
- Demo purge: only 15 `mirror_patterns` demo rows existed; exported to `/mnt/documents/shutap-demo-purge-20260715-102053/` then deleted. No `is_seed=true` rows in `situations`, `rooms`, or `comments`.

## Still open — this turn

### A. Admin gating end-to-end
- Mechanism: reuse existing `public.user_roles` + `has_role(uid, 'admin')` (already the source of truth on server fns). Grant your account admin by inserting one row in `user_roles` (I'll surface the UUID + one-line SQL for you to run; no code needs your email hardcoded).
- `/admin` route: keep `ssr:false` + `robots:noindex` (already set). Add a client-side `beforeLoad` that calls a lightweight `amIAdmin` server fn and throws `notFound()` for non-admins so unauthorized users see the app's 404, not a "forbidden" card.
- Sitemap: confirm `/admin` and `/admin/*` are absent from `sitemap.xml` and children (they already are — admin routes aren't enumerated; will double-check).

### B. Companion-bubble pink dot for unseen companion replies
- Currently `CompanionBubble` shows the dot only for due check-ins. Extend the same indicator to fire when the signed-in author has unseen companion comments on their own rooms.
- New server fn `getUnseenCompanionCount` (uses `profiles.companion_seen_at` + `comments.is_companion` on rooms owned by the caller).
- `CompanionBubble` ORs `hasDue || hasUnseenCompanion`; tapping the bubble stamps `companion_seen_at = now()` via `markCompanionSeen`.

### C. Analytics events
- Emit `cold_relate_nudge_shown` when `RelateNudge` renders and `cold_relate_nudge_accepted` on tap — via existing `track()` helper. Also emit `companion_comment_created` on server insert.

### D. Honest-counts audit (read-only sweep, tiny fixes if needed)
- Audit call sites of `room.relates`, `room.reactions`, `room.sitting`, `room.comments` in `RoomTile`, `RoomDetail`, `Stream`, home strips, Hall pages, pillar densities. Any hardcoded floors (`|| 3`, `Math.max(1, …)`) or seed constants get replaced with the raw value + a zero-state string. Report each site touched.

### E. Seed-safety guards (future-proofing after the purge)
- Add `is_seed=false` filter to any list query that doesn't already have it: `Stream.tsx` realtime + initial fetch, pillar densities, Hall of Fame aggregator, matcher (already excludes seeds via SQL — verify).
- Add a small admin-only "demo import" affordance? **No** — user asked to purge and not touch agent logic; skip.

## Files this turn will change

- `src/lib/admin.functions.ts` — add `amIAdmin`, `getUnseenCompanionCount`, `markCompanionSeen`.
- `src/routes/admin.tsx` — `beforeLoad` calls `amIAdmin`; throw `notFound()` otherwise.
- `src/pages/Admin.tsx` — remove the "forbidden card" branch (unreachable after 404 gate); minor copy pass.
- `src/components/CompanionBubble.tsx` — merge unseen-companion signal into the pink dot; call `markCompanionSeen` on open.
- `src/components/RelateNudge.tsx` — add `track('cold_relate_nudge_shown' | '…accepted')`.
- `src/lib/situations.functions.ts` — emit `companion_comment_created` after insert.
- Sweep (read-then-patch as needed): `src/components/RoomTile.tsx`, `src/pages/Stream.tsx`, `src/pages/Halls.tsx`, `src/pages/home/sections/RoomsStrip.tsx`, `src/lib/pillars.functions.ts` — enforce `is_seed=false`, remove any invented floors.

## Tables touched (this turn)

- Reads only: `user_roles`, `profiles`, `comments`, `situations`, `rooms`.
- Writes: `profiles.companion_seen_at` (via `markCompanionSeen`). No new migrations required.

## One thing I need from you

Confirm your Supabase `auth.users.id` (or the email on your account) so I can print the exact one-line SQL to grant yourself `admin` in `user_roles`. I will not hardcode it in app code.

## Out of scope (per your constraints)

- Spill/Scan agent prompts, Mirror pipeline, billing/Stripe.
- Any new demo/seed content — purge remains permanent.
