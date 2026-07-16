## Goal

On `/admin` (and `/admin/analytics`), split visit stats into **humans** vs **bots** so the numbers reflect real people, not crawlers.

## Approach

The `public.visits` table already stores `user_agent` but has no bot flag. Rather than schema changes, classify at query time using a UA regex — same technique analytics tools use for a first pass. Signed-in visits (`user_id IS NOT NULL`) are always treated as human.

Bot UA pattern (case-insensitive):
`bot|crawler|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|w3c_validator|whatsapp|telegram|discordbot|linkedinbot|twitterbot|applebot|yandex|duckduckbot|petalbot|semrush|ahrefs|mj12|dotbot|headlesschrome|phantomjs|puppeteer|playwright|axios|python-requests|curl|wget|node-fetch|go-http-client|httpclient|monitor|uptimerobot|pingdom|gtmetrix|lighthouse|pagespeed|preview`

Empty/null UA → bot (no real browser sends empty UA).

## Changes

### 1. `src/lib/admin.functions.ts`
- Add a shared `BOT_UA_RE` constant and a small SQL fragment builder.
- Rework the visit KPIs in `adminAnalytics` (and the liquidity/visit counts in `adminLiquidityStats` if they read visits) to return **both** buckets:
  - `visits: { total, d7, d30, new_30d, returning_30d }` → keep as "all"
  - add `visits_human: { total, d7, d30, new_30d, returning_30d }`
  - add `visits_bot:   { total, d7, d30 }`
- Because supabase-js can't express regex easily on a `count` query, switch these counts to a single `rpc` or use `supabaseAdmin.rpc('exec_sql', ...)` — cleaner path: add a SQL view `public.visits_classified` (SECURITY INVOKER, admin-only via RLS) with a computed `is_bot boolean`, then run the same count queries against the view. View is created in a migration; no data migration needed.
- DAU/WAU/MAU already come from `admin_active_users()` (events + non-anonymous profiles) so they're human-only by construction — leave alone, but note it in the UI.
- Top countries: add a second query filtered to `is_bot = false` and return `top_countries_human`.

### 2. Migration
- `CREATE OR REPLACE VIEW public.visits_classified AS SELECT v.*, (v.user_id IS NULL AND (v.user_agent IS NULL OR v.user_agent ~* '<pattern>')) AS is_bot FROM public.visits v;`
- `GRANT SELECT ON public.visits_classified TO authenticated;` (RLS on underlying table already restricts to admin/self).

### 3. `src/routes/_authenticated/admin.analytics.tsx`
- In the "headline" grid: replace the three visit cards with a **Humans / Bots** toggle (segmented control) that swaps the numbers, defaulting to Humans. Show a small "(bots: N)" caption under each human card.
- "top countries" panel: use `top_countries_human`, add a tiny toggle in the panel header to peek at bot countries.
- Add a one-line footnote: "Bots detected by user-agent heuristics; signed-in sessions always counted as human."

### 4. `src/pages/Admin.tsx`
- Liquidity KPIs don't display visits directly, so no changes here unless we want a "human visits · 24h" chip. Skip for this pass.

## Out of scope
- No new tracking-time bot flag column (would require backfill). Can revisit later if we want persistent classification or richer signals (Cloudflare bot score, etc.).
- No changes to events/DAU logic.

## Verification
- Load `/admin/analytics` as the admin account, toggle Humans/Bots, confirm bot count ≈ known crawler traffic and human numbers drop meaningfully. Spot-check one bot country (often `US` for cloud UAs) disappears from the human list.
