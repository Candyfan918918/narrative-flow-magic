# Shutap Launch Infrastructure — Build Plan

Source: `shutap-launch-infra-solutions.md`. Six phases ordered so each unblocks the next, matching the spec's build order (§ at end of doc).

Current state check: Auth + Postgres are already live (Lovable Cloud). The `embedding` column does **not** yet exist; pgvector is not enabled; check-ins schedule via `pg_cron`-style RPC but dispatch is partial; PostHog is not wired; Matcher is tag/recency only; comments already exist.

So Phase 1 (the "kill localStorage" prerequisite) is largely done — we'll just audit residual `localStorage` situation/checkin code and remove it.

---

## Phase 1 — Audit & finalize the DB-of-record (§8.5 prereq)
- Sweep for any situation / check-in / identity state still in `localStorage` (e.g. `shutap_pending_save`, situation merges in `Stream.dc.html`). Keep localStorage only as a session cache + pseudonym mirror.
- Confirm RLS + GRANTs on all situation/comment/checkin/subscription tables.

## Phase 2 — Honest liquidity (§7)
**2a. Matcher v2 + honest resonance number (§7.3, §7.5)**
- Enable `pgvector` extension; add `embedding vector(1536)` (already nullable per spec note — verify), backfill job using Lovable AI Gateway embeddings.
- `matchSituations` server fn: cosine top-K over **real, public, non-crisis, non-seed** corpus, rerank by recency + relate density.
- UI rule: show numeric "N lived this" only when N ≥ 5; else story-based "someone went through almost exactly this →"; at 0, lean on Companion + SLA. Strip every hard-coded count.

**2b. Seed wall-off**
- `is_seed = true` rows: never counted, never matched, visually labeled "ambient" once real density crosses a floor.

**2c. Single-pillar gating**
- `pillar_status` table: `{ pillar, opened_at, real_story_floor, sla_target }`. Public stream filters to opened pillars only.

**2d. Human-relate SLA + ops queue (§7.6)**
- New `/admin/relate-queue`: un-responded public spills oldest first, with `support_mode` badge, one-click reactions, comment box.
- `time_to_first_human_response` computed per situation; alert row when past threshold.

## Phase 3 — Retention spine (§8)
- Move scheduling from any client timer to **`pg_cron` minute-poll** of `checkins` (table exists). Dispatcher = server fn (Supabase-native option; Inngest not needed at this scale).
- Channel cascade: in-app eye → web push → email (Resend connector). Idempotent per `(situation_id, beat)`; backoff; suppress emails after 2 unopened beats; quiet hours + tz; crisis override routes to safety, never paywall.
- **PWA + Web Push:** service worker, VAPID keys, permission prompt fired at felt-heard moment ("want me to check in on you?") — never on landing.
- Cancel jobs on situation delete.

## Phase 4 — Mirror's real intelligence (§9)
- Embedding job on every new situation (reuses Phase 2 infra).
- `patterns` table; **Memory batch** server fn: per-user clusters, trigger correlation, decision↔outcome correlation, trajectory curves.
- Cross-user corpus aggregates with **k-anonymity** floor (`k ≥ 5`).
- Mirror persona re-voices structured findings only; every claim cites support count; below-threshold UI says **"your Mirror is still forming — N more check-ins"** (no illustrative bars).

## Phase 5 — Observability & growth (§11, §12)
- Typed PostHog layer (`src/lib/analytics.ts`), pseudonymous id only.
- 7 dashboards via PostHog: Activation, Liquidity, Retention, Monetization, Capture, Safety, Growth.
- Signed share-token on MGM cards `{ sharer_pseudonym_id, situation_id, channel }`; attribute click + signup; K-factor dashboard.

## Phase 6 — Reach (§13–§15)
- SEO: convert QAPage / Dataset / hub routes to SSR (TanStack Start already supports it — just remove `ssr: false` on the relevant public routes and feed loader data into `head()`); de-index on delete.
- A11y pass (contrast on pink-on-blush, `prefers-reduced-motion`, keyboard nav).
- i18n scaffolding + locale-tuned persona prompts (not literal string swap).
- Native (Expo) only when retention economics justify — deferred.

---

## Technical notes
- **No Edge Functions** for app-internal logic — all dispatchers/matchers are `createServerFn`. `pg_cron` calls a `/api/public/hooks/dispatch-checkins` route (already exists) on a 1-min schedule.
- **Embeddings model:** `google/text-embedding-004` via Lovable AI Gateway (1536-d → fits existing column once added).
- **Resend** is a connector — add via standard connectors when Phase 3 lands.
- **VAPID keys** stored as secrets (`VAPID_PUBLIC_KEY` exposed via `VITE_`, `VAPID_PRIVATE_KEY` server-only).
- Per spec: never astroturf, never fake counts, never match seed/crisis/private rows.

---

## Suggested first slice (1 PR-worth)
Phase 2a + 2b + 2d — the trust-critical pieces. This makes the live app honest *today* (no fake "N lived this"), enables real matching as soon as embeddings backfill, and gives you the ops queue to actually meet the SLA. Phases 3–6 follow in order.

Shall I start with Phase 2a (pgvector + honest resonance + Matcher v2)?
