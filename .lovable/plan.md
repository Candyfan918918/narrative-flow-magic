# Admin Console Cleanup + Growth View

Note: this scope was implemented in the previous build turn. Audit below shows current state matches the plan; re-issuing so you can approve a no-op or point out gaps.

## Current state audit

- `src/components/AdminShell.tsx` — exists, flat nav row (overview · analytics · users · events · feedback · relate SLA), noindex meta.
- Routes wrapped in AdminShell: `admin.tsx`, `admin.analytics.tsx`, `admin.users.tsx`, `admin.events.tsx`, `admin.feedback.tsx`, `admin.relate.tsx`. Legacy `admin_.relate-queue.tsx` removed.
- `/admin/analytics`: Users cards (toggle-independent) split from Visits cards (toggle-driven); "bots: N" sublabels removed; single humans/bots/all toggle.
- Growth section on analytics: `adminGrowth()` in `src/lib/admin.functions.ts` returns D/W/M comparisons + 30-day series for signups and human visits.
- Acquisition: `visits` migrated with `referrer`, `referrer_domain`, `utm_*`, `landing_path`; `visits_classified` view updated; `src/lib/tracking.ts` + `tracking.functions.ts` capture per session; `adminAcquisition()` returns top referrer domains, UTM source/campaign, landing paths, direct/search/social/referral split.
- `/admin` overview: product KPI row via `adminProductKpis()` (spills, scans, comments, crisis, mirror subs, trialing) + scheduler health card; ad-hoc footer links removed; needs-response/new-rooms is a subordinate segmented control.
- `/admin/feedback`: header summary above list.

## What would change if you approve

Nothing — this is a confirmation pass. If you have specific gaps (a missing metric, a card still duplicated, a nav item to add/rename), reply with them and I'll ship a focused follow-up plan.
