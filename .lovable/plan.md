# The Mirror — Implementation Plan

The Mirror becomes a personalized, evolving portrait of each user's behavior across five life districts. Everything renders from that user's own rows; a seeded demo cast exists only for logged-out/preview surfaces and is never mixed into a real user's data. Every model call goes through this project's existing Lovable AI Gateway (Gemini); no Anthropic references anywhere.

---

## Phase 1 — Migration (Supabase)

Single migration creating two tables + helpers, with GRANTs + RLS.

**`mirror_patterns`**
- `id uuid pk default gen_random_uuid()`
- `user_id uuid null references auth.users(id) on delete cascade`
- `is_demo boolean not null default false`
- `name text`, `emoji text`, `district text check in (self|career|love|family|social)`
- `rarity text check in (common|uncommon|rare|epic|legendary)`
- `state text check in (active|ruin) default 'active'`
- `insight text`, `punch text not null default ''`, `record text`
- `count int not null default 0`, `depth int not null default 1`
- `trend numeric[] not null default '{0,0,0,0,0,0,0}'`
- `trend_dir text check in (rising|steady|cooling|dormant) default 'steady'`
- `sources jsonb not null default '{"spill":0,"scan":0,"comments":0,"likes":0,"follows":0,"browse":0}'`
- `embedding vector(768)`
- `first_seen/last_seen timestamptz`, `position jsonb`, `created_at/updated_at`
- Constraint: `(is_demo = true AND user_id IS NULL) OR (is_demo = false AND user_id IS NOT NULL)`
- Indexes: `(user_id, last_seen desc)`, `(is_demo)`, ivfflat on `embedding`

**`mirror_signals`** (append-only provenance)
- `id, user_id, pattern_id null, source, ref_id, text_scrubbed, embedding vector(768), created_at`
- Unique `(user_id, source, ref_id)` for idempotency

**RLS / GRANTs**
- `GRANT SELECT, INSERT, UPDATE, DELETE ON mirror_patterns TO authenticated`
- `GRANT SELECT ON mirror_patterns TO anon` (demo-only policy below)
- `GRANT ALL ON mirror_patterns TO service_role`
- Same for `mirror_signals` minus anon
- Policies:
  - `mirror_patterns`: self CRUD where `user_id = auth.uid() AND is_demo = false`; anon+authenticated SELECT where `is_demo = true`
  - `mirror_signals`: self CRUD where `user_id = auth.uid()`
- Trigger `touch_updated_at` on both

**Helper SQL**
- `match_user_patterns(p_user uuid, q vector, k int, floor float)` — cosine search scoped to that user's patterns
- `mirror_depth_for(count int)` immutable — thresholds <10/<25/<60/<120/≥120 → 1..5
- `recompute_mirror_evolution()` — nightly job: recompute `depth`, `trend_dir`, ruin state (last_seen older than decay window)

---

## Phase 2 — AI Agents (Gemini gateway only)

New file `src/lib/agents/mirror.functions.ts` with three `createServerFn` agents, each calling `callAgent()` from `src/lib/agents/gateway.ts` (Lovable AI Gateway, Gemini). Strict-JSON parse with fence strip; on failure use authored fallback pools so `punch` is never blank.

- **MirrorReading**(scrubbed_text, district_hint?) → `{ burn, read, filed, trait:{name,emoji,rarity,district,insight} }`
- **MirrorPunch**(pattern row + sources mix + count/depth/trend) → `{ punch, record }` — persisted to row
- **MirrorCrossRead**(user's pattern roster) → `{ sees, throughline, record }` — cached on `mirror_shape` (existing table) or new `mirror_cross_reads` row keyed by user; regenerated when roster materially changes

System prompts encode voice: observational, lowercase, present tense 2nd person, one specific number, reject advice tokens (`you should|try|consider|recommend`) and clinical labels in a post-validator. Crisis guard (existing `guard.functions.ts`) runs first and swaps to non-clinical support register.

Guardrails module `src/lib/agents/mirror-guards.ts`: enforces ≤4-word name, single emoji, char cap, enum check, advice/clinical token reject → fallback.

---

## Phase 3 — Collection Pipeline (server)

`src/lib/mirror-pipeline.functions.ts` — single `ingestMirrorEvent({ source, ref_id, raw_text })` server fn with `requireSupabaseAuth`. Idempotent via unique `(user_id, source, ref_id)`.

Steps:
1. PII scrub (reuse `scrubber.functions.ts`)
2. Embed via existing `embeddings.server.ts` (768-d)
3. `match_user_patterns(auth.uid(), embedding, 1, 0.78)`
4. **Match** → bump `sources[source]`, `count=sum(sources)`, `depth=mirror_depth_for(count)`, push to weekly trend bucket, recompute `trend_dir`, nudge centroid (running average), `last_seen=now()`. If meaningful deepen (depth tier crossed) → re-run MirrorPunch and persist.
5. **No match** → MirrorReading → insert new `mirror_patterns` row (capped at 40 active per user; if at cap, deepen nearest neighbor instead). Immediately MirrorPunch → persist.
6. Insert `mirror_signals` row with `pattern_id`.

**Hookpoints** (no new UI):
- Spill publish (`spill.functions.ts`) → `ingestMirrorEvent('spill', situation_id, clean_text)`
- Scan complete (`scan.functions.ts` / `scan-turn.server.ts`) → `'scan'`
- Comment create (`createComment`) → `'comments'`
- Reaction/relate insert → `'likes'`
- Follow → `'follows'`
- Room dwell (existing telemetry, throttled) → `'browse'`

Hooks are fire-and-forget (`void ingestMirrorEvent(...)`) so they never block the user flow.

**Nightly cron** at `/api/public/hooks/mirror-evolution` calling `recompute_mirror_evolution()` for all users (set by `pg_cron` via the `supabase--insert` tool).

---

## Phase 4 — Reactive Render Layer

Rewrite `src/pages/Mirror.tsx` (and the existing companion-pop access point) to:
- Query `mirror_patterns` where `user_id = auth.uid() AND is_demo = false`
- If `count < 2` → **forming state** copy ("it begins the moment you spill or scan")
- Else render the card deck + world band + cross-read panel

New components under `src/components/mirror/`:
- `MirrorCard.tsx` — frame chrome (rarity numeral I–V, district sigil, gold at legendary), DepthWheel (radial gauge, orbit dot speed = `trend_dir`), TrendChart (7-pt line+area+pulse), SignalBar (six glyphs from `sources`), count tick-up, punch line, stamp
- `MirrorReveal.tsx` — front-always-upright open animation (scale+tilt+fade, no Y-flip), sweep → draw → fill → tick → punch
- `WorldBand.tsx` — district skyline from per-district `sum(count)`, ruins desaturated/cracked
- `CrossReadPanel.tsx` — cached `{sees, throughline, record}`
- `MirrorShareImage.tsx` + server route that exports PNG (reuse `ScanShareCard` html-to-image pipeline; freeze animations to a single frame)

**Never-blank law**: card reads from DB; opens issue zero model calls. All animations gate on `prefers-reduced-motion` and degrade to a static, upright, fully-populated render.

Companion-pop entry stays as the two existing surfaces (landing CTA + companion eye). Paid gate via existing `has_active_mirror`.

---

## Phase 5 — Demo Cast

Seed migration (separate, idempotent `INSERT ... ON CONFLICT DO NOTHING`) — ~15 `mirror_patterns` rows with `is_demo=true, user_id=NULL` covering: a Legendary, 2–3 ruins, the five districts, varied rarity/depth/trend. Used by:
- Logged-out `/mirror` marketing preview
- First-run "this is what your Mirror becomes" splash (tagged "illustrative")
- Screenshot/OG endpoints

Render path enforces `is_demo=true` filter on these surfaces and `is_demo=false` on the authenticated grid. Helper `useMirrorPatterns({ demo: boolean })`.

---

## Phase 6 — Acceptance Tests

- `tests/mirror-isolation.test.ts` — fresh user → empty real grid, forming state; demo rows never appear in their query; two seeded users with divergent ingest produce divergent patterns/punches
- `tests/mirror-guards.test.ts` — punches reject advice tokens, fall back cleanly
- `tests/mirror-never-blank.test.ts` — render card with empty animation context, asserts punch/count/trend visible
- Manual: grep diff for hardcoded names/counts in render path; verify network panel shows zero model calls on card open
- Grep guard: no `anthropic`, `claude.complete`, or `window.claude` introduced

---

## Files touched (high-level)

**New**
- `supabase/migrations/*_mirror.sql` (via migration tool)
- `src/lib/agents/mirror.functions.ts`
- `src/lib/agents/mirror-guards.ts`
- `src/lib/mirror-pipeline.functions.ts`
- `src/components/mirror/{MirrorCard,MirrorReveal,DepthWheel,TrendChart,SignalBar,WorldBand,CrossReadPanel,MirrorShareImage}.tsx`
- `src/routes/api/public/hooks/mirror-evolution.ts`
- `src/routes/api/mirror/share.$id.tsx` (PNG export)
- Demo seed migration

**Modified (additive, hookpoints only)**
- `src/lib/agents/spill.functions.ts`, `scan-turn.server.ts`, `createComment` path, reactions/relate/follow handlers, browse-dwell telemetry → `void ingestMirrorEvent(...)`
- `src/pages/Mirror.tsx` rewritten to reactive query
- `src/routes/_authenticated/mirror.tsx` head copy
- Companion-pop trigger keeps its two existing surfaces

**Untouched**
- `src/integrations/supabase/*` autogen
- Existing Anthropic-free agent gateway (`gateway.ts`, `ai-gateway.server.ts`, `/api/complete`)
- Static `/shutap/*` html (not used by Mirror)

---

## Open assumption (flag, not block)
- The "Mirror cap ~40 active patterns per user" is enforced by deepening the nearest neighbor when full, so the roster bounds itself organically. Ruins do not count against the cap.
- 768-d embeddings match the existing `situations.embedding` column dimension; if your current embeddings model differs, I will align `mirror_patterns.embedding` to the same dim in the migration before running it.

Approve and I'll start with the migration, then wire the pipeline, then ship the render layer.
