# Shutap Updates 0627 + AI Agents Spec — React build plan

This rips out the `public/shutap/*.html` + iframe `SpaShell` approach entirely and ships every surface as real React pages backed by server functions and Supabase. No static HTML, no localStorage state, no hardcoded scores/labels/copy — every number and string traces to either a query result or a live server model call.

## Phase 0 — Demolish the static layer

- Delete `public/shutap/` and `src/components/SpaShell.tsx`.
- Rewrite `src/pages/{Landing,Welcome,Stream,Room,Profile,Mirror,Halls,Admin,AdminFeedback,AdminRelateQueue,HallOfFame,Subscribe,Legal}.tsx` to render real React layouts (no iframes, no `postMessage` bridge, no `ai-bridge.js`).
- Keep `/api/complete` only as a thin AI gateway wrapper for legacy callers; new code calls typed server functions.

## Phase 1 — Schema delta (one migration)

Add to `public.situations`:
- `body text` (composed in-voice post, distinct from `clean_text` transcript)
- `kind text check (kind in ('spill','scan'))` default `spill`
- `edited boolean default false`
- `deleted_at timestamptz`
- `signature text`, `read text`, `factors text[]`, `initial_scan int`
- `arc jsonb` (the 7-beat structure), `emotional_core text`, `the_real_thing text`, `support_mode text`

New tables (all with GRANTs + RLS + `auth.uid()` policies):
- `comment_records` — `{id, situation_id, author_id, clean_text, edited, deleted_at}` (Agent 4 ownership)
- `mirror_shape` — `{user_id pk, shape, line, movement, at, history jsonb}` (Agent 6)
- `behavioral_events` — `{id, user_id, kind, payload jsonb, created_at}` (Agent 13 source)
- `mirror_sessions` — `{id, user_id, turns jsonb}` (Agent 5 speak channel)

## Phase 2 — Agent server functions (real model calls)

Rewrite under `src/lib/agents/`, each with a strict system prompt + Zod JSON schema + one repair retry + deterministic fallback. Default model `google/gemini-3-flash-preview` via Lovable AI Gateway (`createLovableAiGatewayProvider`). Crisis Guard + PII Scrubber run before every persona turn.

| File | Agent |
|---|---|
| `spill-turn.functions.ts` | §1 — Per-turn react→name→read→ask, returns the strict-JSON `arc`-tracking shape |
| `spill-compose.functions.ts` | §2 — Compose + Edit-with-Spill, voice/facts-locked, re-scrubs |
| `scan-turn.functions.ts` (rewrite) | §3/§12 — Adaptive 9–12 cards, varied widgets, depth gates, final `{done,score,signature,read,factors,pillar}` |
| `comment-compose.functions.ts` | §4 — AI-guided comment suggestions/draft |
| `mirror-speak.functions.ts` | §5 — Reflective conversation reading memory |
| `mirror-shape.functions.ts` | §6/§14 — `{shape,line,movement}` with previous-reading progression |
| `scrubber.functions.ts` (upgrade) | §7 — Server LLM extraction (temp 0) replacing regex |
| `guard.functions.ts` (upgrade) | §8 — Server classifier (temp 0) |
| `matcher.functions.ts` (already exists) | §10 — Keep, honor honesty floor |
| `memory.functions.ts` | §11/§13 — Aggregate counts/trend/top pillar/behavioral profile |

## Phase 3 — Spill v2 React flow

`src/components/spill/SpillSheet.tsx` — slide-up sheet (pink, Newsreader italic bubbles) that:
1. Greets by alias.
2. Loops: POST transcript → `spillTurn` → render 1–3 bubbles, optional question chip.
3. On `decision:"ready"` → support-mode chooser → Crisis recheck → `spillCompose` → `SpillPreview`.
4. `SpillPreview.tsx` — contenteditable title/body, "edit with spill" instruction input (calls `spillEdit`), Post-to-room / Keep-as-journal buttons.
5. On submit → insert `situation` row (visibility public/private) → `navigate({ to: '/room/$id' })` or `/profile?tab=journal`.

Wires `spill_started/turn/completed/ai_edit/room_created/journal_created` events into `behavioral_events`.

## Phase 4 — Adaptive Scan React flow

`src/components/scan/ScanFlow.tsx` (indigo `#7F77DD`, Sora, gauge):
- Six widget components: `ChoiceCard`, `MultiCard`, `RateSlider`, `SpectrumDrag`, `RankList`, `TextCard`.
- Loop posts transcript → `scanTurn` → renders the card type returned by the model.
- On `done:true` → `ScanResult.tsx` shows score gauge, band, signature, read, pillar chip, share card → Post-to-room or Keep-as-journal.
- `ScanShareCard.tsx` (§17) — animated radial ring, spectrum bar with derived marker, looping aura, `prefers-reduced-motion` aware.

## Phase 5 — Content ownership (§3)

`src/components/situation/OwnerMenu.tsx` on every situation tile + Room header when `author_id === user.id`:
- Edit with spill → opens `SpillPreview` again on the existing record.
- Move public ↔ private (toggles `visibility` on same row, no duplicate).
- Soft delete (sets `deleted_at`, cancels checkins via `cancel_pending_checkins`).

Profile tabs (rewrite `src/pages/Profile.tsx`):
- Rooms (own public), Journal (own private spills + scans), Comments — each row has owner menu.

Comments: `CommentList.tsx` reads `comment_records`, author edit/delete with re-scrub on every edit.

## Phase 6 — Mirror engine (§9/§13/§14)

`src/pages/Mirror.tsx` rewrite:
- Server fn `getMirrorMemory` returns `{counts, scanSeries, trend, topPillar, daysSince, firstSeen, lastSeen}`.
- Server fn `getBehavioralProfile` aggregates `behavioral_events` (visits / dwell / sentiment / questions / last_question / top_action / events_total).
- `ShapeOfYouCard` — paints deterministic fallback from trend+pillar first, then fades in `mirrorShape({prev})`, persists to `mirror_shape` with capped history, renders `↗ movement` sub-line.
- `BehavioralCard` — "still learning your rhythm" under 4 events; otherwise stat chips + last question.
- `ArcChart` — sparkline from real `scanSeries`.
- "Sit with the mirror" speak channel uses `mirrorSpeak`.
- Cooldown surfacing (~6h) via `mirror_onboarding.last_offered_at`.

## Phase 7 — Unified shell (§10)

`src/components/AppHeader.tsx` — logo · rooms · halls · profile-pill dropdown (your profile · settings · spill it · the mirror ✦ · admin · sign out). Mounted in `__root.tsx`; route detail pages render contextual back-bar in addition.

## Phase 8 — Cleanup & acceptance

- `rg -n` the diff for hardcoded scores, signatures, "312", "740", "tender defender", "settling/sitting" literals — only band-color/word maps and the 0–999 boundaries are allowed as constants; everything else derives.
- Manual smoke: spill → preview edit → post → land in room; spill → save → land in journal; scan → 10+ cards varied widgets → post-as-room shows score header; mirror with <2 entries → "still taking shape"; with ≥2 → fallback then AI shape with movement.

## Technical notes

- Server functions follow the auth-protected `createServerFn().middleware([requireSupabaseAuth])` pattern; AI calls use the gateway helper inside the handler.
- Bumping `ai-models-chat`: scan/spill/compose/mirror use `google/gemini-3-flash-preview`; scrubber & guard use `google/gemini-3.1-flash-lite` at temp 0.
- Behavioral events fire from React via a small `track()` helper that inserts into `behavioral_events` (RLS = self-only).
- All loaders on `_authenticated/*` routes; public routes (landing, halls, room view) call only `TO anon` SELECT-safe public server fns.

## Scope this plan does NOT cover (call out separately if you want them)

- Server-rendered scan-card to PNG/MP4 export (§17 last bullet) — needs satori/resvg or a worker; ship the in-page animated card now, defer export.
- Memory pipeline `patterns` table + cron clustering (§11) — large async job; build the read surface against live aggregation first.
- Upgrading Crisis Guard / Scrubber to dedicated moderation endpoints — uses gateway classifier now, swap later.
