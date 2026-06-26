## Goal

Implement the Shutap Agent Specs (Launch v2) on top of the existing app: a unified Companion/Mirror voice powered by the Lovable AI Gateway, with the Scrubber and Guard always in front, Scan + Matcher as services, a Scheduler state machine for check-ins, and a Memory pass that builds the moat. Everything inherits the Companion Constitution (§0).

## Build order (mirrors §"Build order" of the spec)

### Phase A — Data model + the two gatekeepers (Scrubber, Guard)

Database additions (one migration, with GRANTs + RLS):
- `situations` (extends today's `rooms` semantics with launch-spec fields): `id`, `alias_id`, `pillar`, `clean_text`, `initial_scan`, `scan_band`, `crisis_flag`, `status` (`in_progress|resolved|avoided|worse`), `tags[]`, `embedding` (nullable, for future), `is_public`, `created_at`. Keep `rooms` for the live UI; add a thin compatibility view or migrate carefully.
- `pii_scrub_log` (`situation_id`, `detected_type`, `replacement_token`, `count`).
- `checkins` (`situation_id`, `type` day0/1/2/3/7/14/adaptive, `scheduled_at`, `channel`, `state`).
- `checkin_responses` (`checkin_id`, `rescan`, `trajectory`, `resolution`, `would_again`, `clean_text` optional).
- `outcomes` (`situation_id`, `decision_summary`, `resolution`, `trajectory_curve` jsonb, `would_again`, `captured_at`).
- `user_patterns` (`alias_id`, `trigger`, `tendency`, `what_helps`, `support` int).
- `crisis_events` (access-controlled — no anon/auth read; service_role only).

Server functions (in `src/lib/agents/`):
- `scrubber.functions.ts` — `scrubText(raw)` returns `{clean_text, replacements[], notice}`. Regex pass for phones/emails/addresses + LLM pass via gateway; over-redact on conflict. Writes `pii_scrub_log`. **No raw text ever persisted.**
- `guard.functions.ts` — `classifyCrisis(clean_text)` returns `{crisis, category, severity}`. Used on spill, optional check-in text, and Mirror outputs.
- Wire both into every existing write path that ingests free text (spill, check-in text, comments).

### Phase B — Companion (spill + felt-heard) + Scan + Matcher

- `scan.functions.ts` — LLM-assisted scoring through gateway, with **deterministic heuristic fallback** (length, pillar, emotion keywords, taps). Returns `{scan 0–999, band, reflection}`.
- `matcher.functions.ts` — MVP `pillar + tags` retrieval over public, non-crisis situations + a truthful `relate` count; LLM rerank optional. Enforces pillar liquidity floor.
- `companion.functions.ts` — three modes (`spill | felt_heard | checkin`). Uses the Constitution as system prompt; spill is ≤3 questions then hands off; felt-heard composes reflection + Matcher resonance + Scan reveal + soft permission ask. Crisis flag replaces the payoff entirely.
- Wire into the Spill overlay on Landing: scrub → guard → scan → matcher → companion. Replace today's ad-hoc `/api/complete` calls for spill with these typed server fns.

### Phase C — Scheduler + Companion check-in voice

- App-side state machine (TanStack server fns + a `pg_cron`-driven `/api/public/cron/checkins` route) for `day0→day1→day2→day3→day7→day14→adaptive30`.
- Channel routing: eye-when-present (in-app card), else email via Resend (requires sending domain — flag if not set).
- Deterministic rules: backoff if day1 + day2 unopened, no stacking, snooze/mute, crisis/`worse` override (no rating, no paywall next).
- Check-in card UI: one-tap enums + optional text (run text back through Scrubber).
- Companion `checkin` mode generates the in-voice line per beat.

### Phase D — Memory + Mirror

- `memory.functions.ts` — runs on `outcome`-eligible events; produces strict JSON `outcome` + per-user `patterns` (support ≥ 2). Excludes crisis situations. No prose to user.
- `mirror.functions.ts` — paid persona, reads `outcomes` + `user_patterns` only; never invents longitudinal claims. Output guard via Guard. Soft paywall only at the day7–14 felt moment; uses existing Stripe subscription gate (`has_active_mirror`).
- Mirror UI: teaser ("your Mirror is forming") for free users; full arc + cross-situation patterns for subscribers; in-voice paywall presentation.

### Phase E — Instrumentation

Extend `feedback_events` (or add `agent_events`) with the spec's event names:
`spill_started/completed`, `felt_heard_passive/active`, `notif_permission_*`, `pii_scrubbed`, `crisis_detected`, `crisis_resources_shown`, `scan_*`, `resonance_surfaced`, `checkin_scheduled/sent/opened/responded`, `outcome_captured`, `situation_resolved`, `mirror_teaser_shown`, `paywall_shown`, `subscribe_*`. Surface counts in `/admin/feedback`.

## Hard rules baked into every prompt

- Single system prompt: the §0 Constitution prepended to every Companion/Mirror call.
- Spill prompt = ≤3 questions, never authors the story.
- Scan = intensity, not judgment; suppressed when `crisis_flag`.
- Scrubber notice surfaced in-voice in the UI ("heads up — I swapped…").
- Guard overrides everything: persona drop + fixed (non-generated) crisis copy block; crisis situations excluded from corpus, matcher, mirror, paywall.
- Mirror diagnosis test: pattern = ship, label = reframe; only re-voices Memory output.

## Technical notes

- All agent calls go through the existing `/api/complete` gateway path (Lovable AI Gateway, `google/gemini-3-flash-preview` default; ANTHROPIC override preserved). New `src/lib/agents/*.functions.ts` wrap typed prompts.
- Cron via Supabase `pg_cron` hitting `/api/public/cron/checkins` (signature-verified).
- Resend send requires a verified domain — will surface a setup step when reached in Phase C.
- Embeddings deferred; Matcher MVP uses pillar + tags + relate counts.
- Existing `rooms`, `room_relates`, `room_reactions` keep powering the Stream/HallOfFame UI; new `situations` table is the canonical source feeding agents. Add a migration that backfills `situations` from `rooms` to avoid a content reset.

## Scope notes / what's NOT in this plan

- No fine-tuning; behavior comes from prompts + the Constitution.
- No new auth/payments — reuses existing Lovable Cloud auth, Stripe subscription, and `_authenticated` gate.
- No design overhaul; the iframe-ported `.dc.html` pages stay as the visual layer. New UI affordances (scrubber notice, check-in card, Mirror panel) added inline.

## Suggested commit cadence

One commit per phase (A→E). Each phase is independently shippable behind a feature flag (`VITE_AGENTS_PHASE`) so we can preview without breaking the live site.