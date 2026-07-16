
# Admin console cleanup + growth view

## Audit findings (current state)

Six admin surfaces, all admin-gated, mixed styling:

| Route | File | Style | Notes |
|---|---|---|---|
| `/admin` | `src/pages/Admin.tsx` | dark `#0f0916` | response floor; footer links to `/admin/feedback` and `/admin_/relate-queue`. Inner tab bar "needs response / new rooms". |
| `/admin/analytics` | `src/routes/_authenticated/admin.analytics.tsx` | light `#fdf0f5` | headline cards + humans/bots/all toggle. Cards duplicate "bots: N" as sublabel. No nav to other admin pages. |
| `/admin/users` | `src/routes/_authenticated/admin.users.tsx` | light | table only. No admin nav. |
| `/admin/events` | `src/routes/_authenticated/admin.events.tsx` | light | table only. No admin nav. |
| `/admin/feedback` | `src/routes/admin.feedback.tsx` → `src/pages/AdminFeedback.tsx` | dark | **BUG: renders `<AdminPage />` — it is literally the response-floor page again, not a feedback view.** `getFeedbackSummary` in `src/lib/feedback-summary.functions.ts` exists but is never rendered. |
| `/admin_/relate-queue` | `src/routes/admin_.relate-queue.tsx` → `src/pages/AdminRelateQueue.tsx` | light | own nav row (`admin`, `feedback`, `embed batch`). Contains the ONLY UI for `schedulerHealth`. |

Repeated / dead surfaces to remove or consolidate:
- `/admin/feedback` currently duplicates `/admin` (wrong component wired). Replace with a real feedback summary UI.
- Ad-hoc footer nav in `/admin` (`Link` to feedback / relate-queue) and separate top nav in `/admin_/relate-queue` — collapse into one shell.
- Analytics headline: `total`, `d7`, `d30` cards each print `bots: N` sublabel; the toggle at the top already answers this. Redundant.
- Analytics `users` cards (real users, new 7d/30d, dau/wau/mau) are always human but sit in the same row as visit cards that respond to the toggle — flipping the toggle leaves them unchanged and looks like nothing happened.
- Analytics has a "top countries" panel with its OWN humans/all toggle in addition to the page-level toggle. Fold into page-level toggle.
- Two URL styles: `/admin/*` vs `/admin_/*`. Move relate queue to `/admin/relate` for consistency.

## Plan

### 1. Single admin shell

- Create `src/components/AdminShell.tsx`: fixed page frame with title, subtitle slot, and a single flat nav row: **overview · analytics · users · events · feedback · relate SLA**. Uses `useRouterState` to mark the active link. Two style variants (`dark` for `/admin`, `light` for everything else) passed via prop so we don't redesign either theme.
- Wrap every admin page in `<AdminShell variant=… active=…>`. Remove the footer links block in `src/pages/Admin.tsx`, the top nav row in `src/pages/AdminRelateQueue.tsx`, and page-local `<h1>` blocks that the shell now renders.
- Move `/admin_/relate-queue` → `/admin/relate` (new route file `src/routes/_authenticated/admin.relate.tsx`, delete `src/routes/admin_.relate-queue.tsx`). Keep `/admin_/relate-queue` as a redirect for one release.
- Inside `/admin` overview, keep the needs-response / new-rooms toggle but render it as a small segmented control clearly below the KPI row, labeled "rooms →", so it doesn't read as a second nav layer.
- Move the `BackfillButton` (embeddings) out of the relate-queue nav into the shell's "utilities" menu on `/admin/relate` only (it's an ops-only action, not global nav).

### 2. De-duplicate `/admin/analytics`

- Split headline into two visually distinct sections:
  - **users** (always human, unaffected by toggle): `real users`, `new · 7d`, `new · 30d`, `dau`, `wau`, `mau`, `guest→sign_up`. Move the humans/bots/all toggle out of this section's header so it's clear it doesn't apply.
  - **visits** (responds to toggle): `total`, `visits · 7d`, `visits · 30d` with `new / returning` sublabel. Toggle sits above this section.
- **Remove** the `bots: N` sublabels on the total/7d/30d cards in the humans view. The toggle is the single source.
- Remove the per-panel humans/all toggle on "top countries" — use the page toggle. Server already returns both `top_countries` and `top_countries_human`; UI just picks one based on `audience`.
- Kill the redundant `audience === 'bot' && bots ? …` branch that computed identical numbers.

### 3. Growth section (new, on `/admin/analytics`)

New server fn `adminGrowth` in `src/lib/admin.functions.ts` returning, humans-only, from `visits_classified` + `profiles`:
- `signups`: `{ day: {curr, prev, delta_pct}, week: {…}, month: {…}, series30d: Array<{date, n}> }`
- `visits`: same shape, from `visits_classified` where `is_bot = false`, distinct-user by session_id per day for the sparkline.
- Periods: today vs yesterday; last 7d vs prior 7d; last 30d vs prior 30d.

New UI section "growth" between headline and providers: two stat blocks (signups, visits) each with three delta chips (D / W / M) and a 30-day bar sparkline. Honest empty state when a period has zero.

### 4. Acquisition — where users come from (new)

Current `visits` schema: `path`, `referrer`, `user_agent`, `country`, `city`, `session_id`. **No UTM columns.**

Two-part change:

a. **Capture** — schema migration adds nullable text columns `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `landing_path` to `public.visits`. `landing_path` is only written on the first visit of a session. Update `src/lib/tracking.functions.ts::recordVisit` input validator and insert to accept and persist these; update the client caller (`src/lib/tracking.ts`) to parse `window.location.search` for `utm_*` on session start and pass `document.referrer` + landing path once per session (stored in `sessionStorage`). Existing rows keep NULLs — honest empty state handles that.

b. **Aggregate** — extend `adminAnalytics` (or new `adminAcquisition` fn) to return, human-only 30d:
- `top_referrers`: hostname of `referrer`, top 10 with counts.
- `top_utm_sources`, `top_utm_campaigns`: top 10 each.
- `top_landing_paths`: top 10.
- `channels`: `{direct, search, social, referral, utm}` computed via referrer hostname allowlist (google/bing/duckduckgo → search; twitter/x/reddit/facebook/instagram/tiktok/linkedin → social; else non-empty referrer → referral; empty referrer & no utm → direct; any utm → utm).

New UI section "acquisition" with four small tables and one channel breakdown bar.

### 5. Gaps to fill on `/admin` overview

New server fn `adminProductKpis` returning:
- `spills_24h`, `spills_7d` (situations where `is_seed = false`, `deleted_at is null`, group by created_at)
- `scans_24h`, `scans_7d` (situations with `initial_scan is not null` in window)
- `comments_24h`, `comments_7d` (comments where `is_companion = false`)
- `crisis_flags_7d` (situations with `crisis_flag = true` in 7d)
- `mirror_subs_active`, `mirror_subs_trialing` (subscriptions where status in `active`/`trialing`)

Render as a new KPI row above the existing liquidity KPIs in `src/pages/Admin.tsx`.

### 6. Feedback + scheduler surfacing

- `getFeedbackSummary` (`src/lib/feedback-summary.functions.ts`) exists but is orphaned. Fix `/admin/feedback` by replacing `src/pages/AdminFeedback.tsx` with a real page that renders the summary (headline sentiment, counts, loved / friction top-12 tables, questions list, byType) wrapped in `AdminShell`. Move to `src/routes/_authenticated/admin.feedback.tsx` and delete the current `src/routes/admin.feedback.tsx` + `src/pages/AdminFeedback.tsx`.
- `schedulerHealth` (`src/lib/scheduler-health.functions.ts`) is only surfaced inside `/admin/relate`. Add its compact 4-stat card to the `/admin` overview under the product KPI row so it's visible at a glance.

## Constraints honored

- Admin gate via existing `assertAdmin` / `has_role('admin')`; no changes to auth.
- `robots: noindex` head is preserved on every route.
- Zero fabricated numbers. Growth deltas render `—` when either side is zero; acquisition tables render honest "no data captured yet" until UTM/referrer rows exist.
- Dark theme kept for `/admin` overview; light theme kept for the rest. `AdminShell` variant prop switches between them without redesigning.

## Files to change

**New**
- `src/components/AdminShell.tsx`
- `src/routes/_authenticated/admin.relate.tsx` (moved from `admin_.relate-queue.tsx`)
- `src/routes/_authenticated/admin.feedback.tsx` (replaces `src/routes/admin.feedback.tsx`)

**Edited**
- `src/pages/Admin.tsx` — wrap in shell, drop footer nav, add product-KPI row + scheduler card, keep tabs as subordinate segmented control.
- `src/routes/_authenticated/admin.analytics.tsx` — wrap in shell; split users/visits sections; remove bot sublabels; remove per-panel country toggle; add growth + acquisition sections.
- `src/routes/_authenticated/admin.users.tsx` — wrap in shell, drop local `<h1>`.
- `src/routes/_authenticated/admin.events.tsx` — wrap in shell, drop local `<h1>`.
- `src/pages/AdminRelateQueue.tsx` — wrap in shell, drop top nav row, keep queue + scheduler card + backfill button.
- `src/lib/admin.functions.ts` — add `adminGrowth`, `adminAcquisition` (or fold into `adminAnalytics`), `adminProductKpis`.
- `src/lib/tracking.functions.ts` — extend `VisitIn` + insert with `utm_*` + `landing_path`.
- `src/lib/tracking.ts` — parse UTM + capture landing path once per session.
- `src/routes/admin.tsx` — no change (gate stays), except `/admin` still owned by dark overview.

**Deleted**
- `src/routes/admin_.relate-queue.tsx` (after redirect period; if user prefers, delete immediately)
- `src/routes/admin.feedback.tsx`
- `src/pages/AdminFeedback.tsx`

**Migration**
- Add nullable `utm_source / utm_medium / utm_campaign / utm_term / utm_content / landing_path` text columns to `public.visits`. No new grants needed (existing grants cover new columns).

## Open questions before build

1. Move `/admin_/relate-queue` → `/admin/relate` with a temporary redirect, or hard-delete the old path?
2. Growth deltas — compare **today vs yesterday** (rolling calendar day in server UTC) or **last 24h vs prior 24h**? Rolling windows are less confusing near midnight; calendar days match common dashboards. Default: rolling 24h/7d/30d unless you prefer calendar.
3. Acquisition channel classifier — OK to hard-code the search/social hostname allowlist above, or do you want it configurable via a small `.ts` constant file?
