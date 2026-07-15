# Public Story Route + Seed Ingestion

## Part A — Public story route (SSR, indexable)

### A1. URL pattern
Route: `/story/$pillar/$slug`
- Fits existing Phase F family (`/is-it-normal/$slug`, `/what-happens/$slug`, `/vent/$topic`).
- Pillar segment scopes the story and enables cheap sibling queries.
- Slug is query-shaped: derived from the Scan's `scan_signature` or a short summary of `clean_text` — first ~8 lowercased kebab words, deduped with a short id suffix (e.g. `/story/marriage/husband-hasnt-touched-me-in-months-a1b2c3`).
- File: `src/routes/story.$pillar.$slug.tsx` (dot convention, matches the rest).

### A2. Gating (server-side, in the loader)
A row renders publicly only if ALL are true:
- `is_public = true`
- `crisis_flag = false`
- `deleted_at IS NULL`
- resonance threshold met — reuse the existing threshold used elsewhere (do NOT invent one). If below threshold, the loader throws `notFound()` and the route sets `robots: noindex`.
Everything else 404s. Private / crisis rows never render, even to their owner on this URL (they have `/room` for that).

### A3. On-page content (server-rendered)
- Scrubbed `clean_text` (the composed narrative).
- Scan verdict: score (0–999) + band label.
- Six-dimension reasoning breakdown from `scan_reasoning` JSON.
- Real relate count (from `room_relates`), rendered as an integer only — no rounding up, no "~".
- Outcome block if `outcomes` row exists for the situation.
- "spill yours" CTA linking to the pillar's Spill entry.
- 3–4 internal links to sibling stories in the same pillar (loader does a second query: same pillar, gate-passing, ordered by relates desc, excluding current id).

### A4. SEO head
- `title`: framed as the search query a person would type, derived from `clean_text` + pillar (e.g. "is it normal that my husband hasn't touched me in months?"). Not the raw story title.
- `description`: first ~150 chars of `clean_text`, stripped.
- `canonical` + `og:url`: `${SITE_URL}/story/${pillar}/${slug}` (self-referential — leaf only).
- OG: `og:title`, `og:description`, `og:type=article`. No `og:image` unless we have a real one; hosting will inject the default.
- Structured data: **DiscussionForumPosting**. Rationale: Shutap stories are first-person lived experiences with reactions/relates, not Q&A pairs with accepted answers. `QAPage` requires a defined Question + Answer(s), which we don't have. `DiscussionForumPosting` (Google-supported since 2023) matches the "someone shared, others reacted" shape and lets us surface `interactionStatistic` for relate counts.
- `robots: noindex` when the gate has not passed; removed once it does (see A6).

### A5. Sitemap
Add a new child sitemap: `src/routes/sitemaps/stories[.]xml.ts`.
- Server route queries all situations that pass the public gate (same predicate as A2) and emits one `<url>` per row.
- Register the child in `src/routes/sitemap[.]xml.ts` behind a "has ≥1 indexable story" check, matching the existing pattern used for outcomes/profiles.
- No changes to `core.xml`.

### A6. Noindex → index transition
Gate is evaluated at request time in the loader; nothing to cron. Crawlers that hit a below-threshold page get `noindex`; once relates cross the threshold, the next crawl sees the page indexable and the sitemap starts advertising it.

### A7. Schema (minimum)
- Add nullable `slug text unique` on `public.situations` + backfill trigger/function to populate on insert when missing. Slug is stable once written.
- No other schema changes needed. `is_seed`, `is_public`, `crisis_flag`, `scan_reasoning` already exist.
- Migration also grants nothing new; reads for the public route go through the service-role client server-side (same pattern used for `pillars.functions.ts`) so column-level revokes on `alias_id` stay intact and `alias_id` is never selected/returned to the client.

---

## Part B — Seed ingestion path

### B1. Mechanism
Admin-only TanStack server function `runSeedBatch` in `src/lib/seed-ingest.functions.ts`, invoked from a new admin page `src/routes/_authenticated/admin.seed.tsx`.
- `.middleware([requireSupabaseAuth])` + explicit `has_role(userId, 'admin')` check (matches the pattern in existing admin functions).
- Input: array of `{ raw_text, pillar, alias?, outcome? }` drafts (Zod-validated, capped at e.g. 25 per call).
- For each draft, calls the exact same chain as an organic Spill: `runScrub` → situation insert → `scanIntensity` (produces real six-dimension `scan_reasoning`) → embed → `schedule_checkins` → `ingestMirrorSignal`. No shortcuts, no direct writes bypassing an agent.
- Reuses `runSpill`'s internals — refactored so the shared body accepts an `is_seed` flag, or simply calls `runSpill` under a seed-context wrapper. No prompt or behavior changes to the agents themselves.

### B2. is_seed propagation
- `situations.is_seed = true` for every seeded row.
- `scan_reasoning` JSON gets `{ ...reasoning, is_seed: true }` so any downstream consumer can filter without a join.
- Mirror ingest call passes a `is_seed: true` flag through `ingestMirrorSignal`'s options; the resulting `mirror_signals` / `mirror_patterns` rows carry the same marker (adds `is_seed boolean default false` to those two tables — the only additional schema change).
- Optional field on the admin form: `outcome` — if present, insert a matching `outcomes` row with `is_seed: true` too (add column to `outcomes`).

### B3. Exclusion rules
- Hall of Fame queries add `AND is_seed = false`.
- Any admin "N users lived this" / aggregate copy filters `is_seed = false`.
- Public story route still renders seeds (they're the whole point for SEO), but the on-page relate count is real relates only — seeds don't self-relate.
- Sitemap includes seeded stories.

### B4. Open decision (flagged, not decided)
Should seeded situations count toward the resonance "N people lived this" number shown on story pages and match cards, or should that count be real-only? Recommend surfacing this as a config flag `RESONANCE_INCLUDES_SEEDS` (default: your call) so it can flip without code changes.

---

## Files to change / add

**New**
- `src/routes/story.$pillar.$slug.tsx` — SSR route, loader + head + component.
- `src/routes/sitemaps/stories[.]xml.ts` — child sitemap.
- `src/lib/seo/story.ts` — slug generation, gate predicate, query-shaped title builder, DiscussionForumPosting JSON-LD builder.
- `src/lib/seed-ingest.functions.ts` — admin server fn.
- `src/routes/_authenticated/admin.seed.tsx` — admin UI (textarea/JSON paste + run button + per-row result).

**Edited**
- `src/routes/sitemap[.]xml.ts` — add stories child conditionally.
- `src/lib/agents/spill.functions.ts` — thread optional `is_seed` through the pipeline (no prompt/behavior changes).
- `src/lib/mirror-pipeline.functions.ts` — accept `is_seed`, persist to mirror rows.
- `src/lib/situations.functions.ts` — expose a public read helper (via admin client, alias_id never selected) for the story route + sibling query.
- Hall of Fame / aggregate queries (search for existing `situations`+`is_seed` filters and extend) — TBD list, will enumerate in build phase.

**Migrations**
1. `situations.slug text unique` + backfill + trigger to auto-fill on insert.
2. `mirror_signals.is_seed`, `mirror_patterns.is_seed`, `outcomes.is_seed` — all `boolean not null default false`.

## Constraints honored
- No agent prompt or behavior changes.
- No new resonance threshold — reuses existing config.
- Nothing behind the paywall changes.
- Schema additions are the minimum needed (slug + three `is_seed` columns).

Confirm and I'll implement.
