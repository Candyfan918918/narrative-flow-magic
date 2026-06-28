## Phase 3 — Retention Engine

Move check-ins from "scheduled rows we never deliver" to "rows the server actually fires on time," and add the two channels needed at launch.

### Scope (3 slices)

**3a. Server scheduler (required, ships first)**
- New public route `src/routes/api/public/checkins.run.ts` that:
  - Selects due `checkins` rows: `state='scheduled' AND scheduled_at <= now()` (cap 200/run).
  - For each: render copy based on `type` (day0…day14), dispatch via the row's `channel` (`eye` = in-app only, `email` = Resend), then mark `state='sent'` and stamp `sent_at`.
  - Idempotent (single update guarded by `state='scheduled'`).
  - Auth: caller must include `apikey` header = `SUPABASE_PUBLISHABLE_KEY` (canonical pg_cron pattern; no new secret).
- New `pg_cron` job every 1 minute that POSTs to `…/api/public/checkins.run` on the stable `project--{id}.lovable.app` URL.
- Admin view extension: a tiny "scheduler health" card on `/admin/relate-queue` showing `scheduled / sent / failed` counts for the last 24h.

**3b. Email channel via Resend (required for `email` channel rows)**
- Adds `RESEND_API_KEY` secret (I'll request it via the secret tool).
- New server-only helper `src/lib/email.server.ts` with `sendCheckinEmail({ to, type, situationId })`.
- Templates inline (5 variants: day1, day2, day3, day7, day14) — copy mirrors the launch spec's check-in voice; each ends with a deep link to `/checkin/<id>`.
- Failure → mark row `state='failed'`, log to `feedback_events`, leave for retry on next tick (cap 3 attempts via a new `attempts` column).
- Migration adds: `checkins.attempts int default 0`, `checkins.last_error text`.

**3c. PWA Web Push (deferred recommendation)**
The PWA skill we have to follow forbids registering an app-shell service worker in Lovable preview, requires a dedicated `firebase-messaging-sw.js`-style worker, and needs VAPID keys + a `push_subscriptions` table + a `<UNSAFE>` user permission prompt. Recommend cutting from launch and shipping email + in-app `eye` check-ins only — push is a real 1–2 day slice on its own and the spec already treats `eye` (in-app) as the primary day0 surface.

### Out of scope this round
- Crisis-flag escalation paths (separate spec).
- Marketing emails / digest (different cadence + unsubscribe infra).

### Data model touch
```text
ALTER TABLE public.checkins
  ADD COLUMN attempts int NOT NULL DEFAULT 0,
  ADD COLUMN last_error text;
```

### Decisions I need from you
1. Confirm **3a + 3b** for this round and **defer 3c (web push)** to a follow-up — or keep push in scope and I'll add the extra ~1 day of work.
2. Do you have a Resend account / sender domain already wired (Lovable Cloud email infra), or should I scaffold a generic `onboarding@resend.dev` sender for sandbox and gate prod sends behind a domain-verify check?
