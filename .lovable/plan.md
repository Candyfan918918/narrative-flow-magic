# Admin Console Cleanup + Growth View

Admin-only (`has_role('admin')`), `noindex`, no fabricated numbers — real data or an honest empty state. Existing per-page styling preserved.

## 1. One admin shell

New `src/components/AdminShell.tsx` renders a single flat nav row on every admin page:

`overview · analytics · users · events · feedback · relate SLA`

- Replaces ad-hoc footer link rows on `/admin` and duplicated links on other admin pages.
- Every admin route wraps its content in `<AdminShell>`; nav highlights active route from the router.
- No nested tab bars. On `/admin`, the needs-response / new-rooms control stays but is restyled as a clearly subordinate segmented control below the page title, not a second nav layer.
- Consolidate URLs: rename `admin_.relate-queue.tsx` → `admin.relate.tsx` (kept as the "relate SLA" tab). Old path 301s via a `<Navigate>` route.

## 2. De-duplicated `/admin/analytics`

Audit findings (repeated content across admin pages today):
- "bots: N" sub-labels under every visit card (redundant with the toggle).
- "Human visits" cards shown alongside "Total visits" cards — two encodings of the same toggle state.
- "New signups 7d/30d" appears on both `/admin` overview and `/admin/analytics` headline — keep on analytics only, remove from overview (overview gets product KPIs instead, see §5).
- `/admin/feedback` currently duplicates the events-table styling with no summary — replaced in §5.

Rework:
- Two visually distinct card groups:
  - **Users** (always human, toggle-independent): total users, new 7d, new 30d, DAU, WAU, MAU.
  - **Visits** (responds to humans / bots / all toggle): total, 7d, 30d, unique sessions 30d.
- Delete the per-card "bots: N" sub-labels.
- One toggle at the top of the Visits group only.

## 3. Growth section (new, on `/admin/analytics`)

For (a) human signups and (b) human visits, show:
- Today vs yesterday, this week vs last week, this month vs last month — value + % delta with up/down arrow.
- Per-day 30-day bar series (simple divs, no chart lib), human-only via `visits_classified`.

Backed by new server fn `adminGrowth()` returning `{ signups: {...}, visits: {...} }` with the six comparisons and the 30-day series each. Returns zeros on empty ranges (honest empty state, no interpolation).

## 4. Acquisition (new)

Audit of `visits` today: captures `country`, `user_agent`, `session_id`, `started_at`. **Does not capture** referrer, UTM params, or landing path.

Plan:
- **Schema migration**: add `referrer text`, `referrer_domain text`, `utm_source text`, `utm_medium text`, `utm_campaign text`, `utm_term text`, `utm_content text`, `landing_path text` to `public.visits`. Extend `visits_classified` view to expose them.
- **Capture**: update `src/lib/tracking.ts` (`recordVisit`) to send `document.referrer`, parsed UTM query params, and `location.pathname` on session start. Server-side helper derives `referrer_domain` from the referrer URL. Stored once per session.
- **Aggregation** (new server fn `adminAcquisition()`, 30d, human-only):
  - Top referrer domains (top 10 + count).
  - Top UTM source / medium / campaign (top 10 each).
  - Top landing paths (top 10).
  - Channel breakdown: direct (no referrer, no utm) · search (referrer domain matches google/bing/duckduckgo/yahoo/baidu/yandex) · social (matches x/twitter/facebook/instagram/tiktok/linkedin/reddit/youtube) · referral (anything else).
- Rendered as four simple lists + a channel bar row on `/admin/analytics` under Growth.

## 5. Gaps filled

- **`/admin` overview product KPI row** (new server fn `adminProductKpis()`): spills 24h/7d, scans 24h/7d, comments 24h/7d, crisis flags 7d, active Mirror subs, trialing subs. All from real tables (`situations`, `scan_events`, `comments`, `crisis_events`, `subscriptions`).
- **Scheduler health**: `checkinsSchedulerHealth()` exists but is unsurfaced. Add a compact "Scheduler" status card (last run, pending count, failures 24h) to `/admin` overview under the KPI row.
- **Feedback summary**: `/admin/feedback` currently just lists rows. Add a small header summary (total 7d/30d, top tag, unresolved count) above the existing list; no redesign.

## Files changed

New:
- `src/components/AdminShell.tsx`
- `src/routes/_authenticated/admin.relate.tsx` (moved from `admin_.relate-queue.tsx`)
- Migration: add UTM/referrer/landing_path columns + update `visits_classified` view

Edited:
- `src/lib/admin.functions.ts` — add `adminGrowth`, `adminAcquisition`, `adminProductKpis`; keep existing fns
- `src/lib/tracking.ts` and `src/lib/tracking.functions.ts` — capture referrer/UTM/landing path once per session
- `src/pages/Admin.tsx` — wrap in `AdminShell`, add product KPI row + scheduler card, remove duplicated signup cards and ad-hoc footer links
- `src/routes/_authenticated/admin.analytics.tsx` — wrap in `AdminShell`, split Users vs Visits cards, remove "bots: N" sub-labels, add Growth + Acquisition sections
- `src/routes/_authenticated/admin.users.tsx`, `admin.events.tsx` — wrap in `AdminShell`, drop duplicate nav
- `src/routes/_authenticated/admin.feedback.tsx` — wrap in `AdminShell`, add summary header
- `src/routeTree.gen.ts` — regenerated automatically

Deleted:
- `src/routes/_authenticated/admin_.relate-queue.tsx` (replaced by `admin.relate.tsx` + redirect)

No UI redesign, no synthetic numbers, admin gate and `noindex` unchanged.
