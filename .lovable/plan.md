
# Public Story Route + Seed Ingestion Path

## Part A — Public Story Route (SSR, indexable)

### 1. URL pattern
`/story/$pillar/$slug`
- `$pillar` = the situation's pillar tag (e.g. `family`, `work`, `love`).
- `$slug` = human-readable slug derived from the situation (query-shaped, e.g. `mom-keeps-comparing-me-to-my-sister`).
- Matches Phase F route family (`/pillar/$name`, `/stream`, existing tag routes).
- Slug stored on `situations.slug`, unique per pillar, auto-generated on insert via trigger; backfill existing public rows.

### 2. Gating (server-side in loader)
Story renders publicly only if ALL true:
- `visibility = 'public'`
- `crisis_flag = false`
- `is_deleted = false`
- Resonance/quality gate met — reuse the existing threshold config (same value Stream and Hall of Fame already read; no new knob).

Behavior:
- Private OR crisis-flagged OR deleted → throw `notFound()` (real 404, never rendered).
- Public but below resonance threshold → render page, but emit `<meta name="robots" content="noindex,follow">` and omit from sitemap.
- Public + above threshold → full index + sitemap entry.

### 3. On-page content
- Scrubbed `clean_text` (never raw text).
- Scan verdict: numeric score (0–999) + band label.
- Six-dimension reasoning breakdown from `situations.reasoning`.
- Real relate count (`room_relates` count for the linked room, or denormalized `relate_count`) — no fake numbers.
- Outcome block from `outcomes` table if present.
- Primary CTA: "Spill yours" → opens SpillModal on landing.
- 3–4 internal links to sibling stories in the same pillar (order by resonance desc, exclude current).

### 4. SEO head (route `head()`)
- `title`: query-shaped, generated from situation. Helper in `src/lib/seo/story.ts`.
- `description`: 150–160 char summary derived from clean_text opening + verdict band.
- `canonical`: `https://shutap.com/story/{pillar}/{slug}` on leaf route only.
- `og:title`, `og:description`, `og:type=article`, `og:url` self-referencing.
- Structured data: **`DiscussionForumPosting`** (not QAPage). Rationale: stories are first-person lived experiences with community resonance (relates, room reactions) — matches forum-post schema. QAPage requires accepted-answer semantics that stories don't have; the Scan verdict is not an "answer".

### 5. Sitemap flow
Add:
- New leaf `src/routes/sitemaps/stories[.]xml.ts` — queries public + non-crisis + above-threshold situations with slugs; emits `<url>` per story.
- Register that leaf in the existing sitemap index route.
- Cache headers matching existing leaves.

### 6. Noindex until gated
Handled by (4) + (5): below-threshold rows emit `noindex,follow` and are excluded from sitemap; promotion to indexed happens automatically when resonance crosses the threshold — no manual step.

## Part B — Seed Ingestion Path

### 1. Mechanism
Admin-only **server function** (`createServerFn` + `requireSupabaseAuth` + `has_role('admin')` check), not a route or edge function. Reasons: reuses existing auth-middleware pattern, avoids a public URL surface, keeps same worker runtime as organic pipeline, invocable from a small admin UI or ad-hoc.

Contract: accepts `{ drafts: Array<{ raw_text, pillar_hint? }> }`, runs each sequentially through the identical organic path:

```
Scrubber → runSpill (situation created) → runScan (six-dim reasoning) → mirror-pipeline ingest
```

No direct DB inserts. Same functions organic users hit — with one extra flag threaded through.

### 2. `is_seed=true` propagation
Single boolean column `is_seed` (default false) on:
- `situations`
- `mirror_signals`
- `mirror_patterns`
- `outcomes`

Threaded via an optional param on `runSpill`, `runScan`, and `mirror-pipeline` handlers (default false so organic path is untouched). No agent prompts change — flag is data-layer only.

### 3. Exclusion from claims
- Hall of Fame filters `is_seed=false`.
- Any aggregate presented as "real users" (landing counters, pillar-page user metrics, admin user dashboards) filters `is_seed=false`.
- Seeds ARE eligible to render as public stories (that's the point) and are counted only in story-level surfaces.

### 4. Open decision (flagged, not decided)
**Do seeds count toward the resonance "N people lived this" number, or is that computed real-only?**
- Option A (count seeds): more stories cross the gate faster, more indexed pages sooner, but the displayed number is partly synthetic.
- Option B (real-only): displayed count is always truthful; seeds carry only their own weight and need real relates to be promoted.
- Recommendation to discuss: **Option B**, with seeds visible pre-gate as `noindex` so they can accumulate real relates organically. Decide before implementation.

## Constraints honored
- No agent prompt or behavior changes.
- Schema additions limited to: `situations.slug` (+ trigger), `is_seed` on four tables.
- Reuses existing resonance threshold config; no new knob.
- Paywalled surfaces untouched.

## Files to change

**New**
- `src/routes/story.$pillar.$slug.tsx` — SSR route, loader, gating, head, JSON-LD.
- `src/routes/sitemaps/stories[.]xml.ts` — stories sitemap leaf.
- `src/lib/seo/story.ts` — query-shaped title, description, JSON-LD builders (client-safe).
- `src/lib/seo/story.server.ts` — server-only gate helpers.
- `src/lib/stories.functions.ts` — `getPublicStory({ pillar, slug })`, `listSiblingStories(pillar, excludeId)`, `listIndexableStories()` for sitemap.
- `src/lib/seed-ingest.functions.ts` — admin `runSeedBatch({ drafts })`.

**Modified**
- `src/routes/sitemap[.]xml.ts` — register the stories leaf in the index.
- `src/lib/agents/spill.functions.ts` — accept + persist `is_seed`.
- `src/lib/agents/scan.functions.ts` — accept + persist `is_seed` on reasoning row.
- `src/lib/mirror-pipeline.functions.ts` — accept + persist `is_seed` on signals/patterns/outcomes.
- Hall of Fame / aggregate query sites (likely `src/lib/hall-of-fame.functions.ts` and landing "N stories" counters) — add `is_seed=false` filter.

**Migration (single file)**
- Add `situations.slug text` + unique index `(pillar, slug)` + auto-slugify trigger on insert + backfill existing public rows.
- Add `is_seed boolean not null default false` to `situations`, `mirror_signals`, `mirror_patterns`, `outcomes`.

## Verification before shipping
- Type/build passes.
- `/story/family/{known-slug}` renders with real data; private + crisis rows 404.
- Below-threshold story shows `noindex` and is absent from `stories.xml`.
- Admin seed run produces situation + reasoning + mirror rows all carrying `is_seed=true`.

Awaiting: confirm URL pattern (`/story/$pillar/$slug`), confirm JSON-LD choice (`DiscussionForumPosting`), and decide the resonance/seed-counting question in Part B step 4.

Note: this phase was already scaffolded in a prior turn — `story.$pillar.$slug.tsx`, `sitemaps/stories[.]xml.ts`, `seo/story.ts`, `seo/story.server.ts`, `seed-ingest.functions.ts`, and the migration are in place. On approval I'll audit each against this spec, add the missing `stories.functions.ts` split (currently inline in the route), verify the sitemap index registration, verify `is_seed` threading through the three agent files, and add the Hall-of-Fame / aggregate filters if not already present.
