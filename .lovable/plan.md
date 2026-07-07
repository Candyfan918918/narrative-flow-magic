## Root causes confirmed

- **RLS is fine.** `mirror_patterns` and `mirror_signals` already have owner-scoped INSERT/UPDATE/SELECT policies against `auth.uid()`. No migration needed.
- The three code bugs (fire-and-forget death, swallowed errors, forming threshold) match the report. Backfill is missing.

## Files to change

### 1. `src/lib/situations.functions.ts`
- `saveSituation`: replace `void runIngestMirrorEvent(...)` with `await runIngestMirrorEvent(...)` wrapped in `try/catch` that `console.error('[mirror-ingest] saveSituation', err)`. Keeps user-facing save resilient.
- `createComment`: same treatment for its `runIngestMirrorEvent` call (source `'comments'`).

### 2. `src/lib/agents/spill.functions.ts`
- Step 5c: replace `void runIngestMirrorEvent(...)` with awaited `try/catch` + `console.error('[mirror-ingest] spill', err)`. Never rethrow.

### 3. `src/lib/mirror-pipeline.functions.ts`
Add error visibility across `runIngestMirrorEvent`:
- Every `.insert()` / `.update()` on `mirror_patterns` and `mirror_signals` (deepen update, crystallize insert, punch update, cap-hit signals insert, no-reading signals insert, final provenance insert) captures `{ error }` and `console.error('[mirror-ingest] <op>', error)` on failure.
- The idempotency `select().maybeSingle()` also logs on error (but keeps existing return).
- No behavioral change on success paths.

### 4. `src/pages/Mirror.tsx`
- Change `const isForming = mineList.length < 2` → `mineList.length < 1`. Cross-read gate (`mineList.length >= 2`) stays.

### 5. New file `src/lib/mirror-backfill.functions.ts`
- `backfillMyMirror` — `createServerFn({ method: 'POST' })` with `requireSupabaseAuth`, no input.
- Loads via `context.supabase`:
  - user's `situations` where `deleted_at IS NULL`, selecting `id, pillar, kind, clean_text, body, title`, ordered `created_at asc`, limit 50.
  - user's `comment_records` (that's the comments table per schema), selecting `id, situation_id, clean_text` (or body field), ordered ascending, limit 50.
- For each row, look up `mirror_signals` by `(user_id, source, ref_id)` — skip if present (also, the pipeline is already idempotent, so this is belt-and-suspenders; can just let the pipeline dedupe).
- Sequentially call `runIngestMirrorEvent({ supabase, userId, data: { source, ref_id, raw_text, district_hint } })`:
  - situation with `kind === 'scan'` → source `'scan'`, otherwise `'spill'`
  - comment → source `'comments'`
  - `district_hint` mapped from pillar exactly like `saveSituation` (`career` → `career`, `family` → `family`, `marriage` → `love`, else `love`).
- Overall cap: 50 total items per invocation (situations first, then comments until 50).
- Return `{ processed, remaining }` so the UI can show progress or re-invoke.

### 6. `src/pages/Mirror.tsx` — backfill trigger
**Chosen trigger: explicit "Reflect my history" button in the Forming state** (not auto-on-load), because:
- awaited ingest of up to 50 items runs multiple LLM calls per item → could take 30–60s; auto-firing on every Mirror mount would spam the gateway and stall the page.
- gives the user a clear cause→effect ("I clicked, my mirror filled").
- avoids double-triggering across tabs/refreshes.

Implementation: in the Forming block, when a signed-in user has 0 patterns, render a button "Reflect my history" that calls `backfillMyMirror` via `useServerFn`, shows a pending spinner, then re-runs the `listMirrorPatterns` query on success. Disable + hide the button afterward.

## No DB migrations
Existing RLS covers the writes. Bug 2 will surface any latent policy issue via console once logging lands; if a real failure appears after this fix, we address it in a follow-up migration.

## Verification (after build mode)
1. Publish a spill as an auth'd user → confirm `mirror_signals` row + a `mirror_patterns` row (`is_demo=false`, `punch` set).
2. Mirror page renders the single pattern (no forming state).
3. Click "Reflect my history" on an account with existing situations/comments → rows accumulate and depth increases.
4. No "Server function info not found" in responses.
