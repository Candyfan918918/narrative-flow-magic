# Fix: Scheduled cron hooks rejected as Unauthorized

## Confirmed problem
- `src/routes/api/public/hooks/{reengagement-emails,dispatch-checkins,mirror-evolution}.ts` require header `x-cron-secret: <process.env.CRON_SECRET>`.
- pg_cron jobs `reengagement-emails` (hourly) and `mirror-evolution-nightly` still POST with only `apikey: <anon JWT>` and `Content-Type`. Every scheduled run is 401ing. Retention nudge emails have gone dark.
- No `dispatch-checkins` cron currently exists; only the two above need rescheduling.

## Fix (rotate + reschedule, both sides in lockstep)
Because the current `CRON_SECRET` value can't be read back, we rotate to a new one so the app secret and the cron SQL both hold the same literal.

1. Generate a fresh strong value `X` (48+ bytes url-safe).
2. Update the app secret `CRON_SECRET` to `X` (via `secrets--update_secret`, secure form).
3. Migration: `cron.unschedule('reengagement-emails')` and `cron.unschedule('mirror-evolution-nightly')`, then re-`cron.schedule` both with `net.http_post(..., headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','X'), body := '{}'::jsonb)` on the same schedules (`15 * * * *` and `17 3 * * *`) and same URLs.
4. Verify: `select * from cron.job` shows the new commands; wait for next tick / manually invoke via `net.http_post` and confirm 200 in `cron.job_run_details` and `stack_modern--server-function-logs`.

## Not doing
- Not weakening auth by re-accepting `apikey` — /api/public/* bypasses edge auth, so the anon key alone is not a real gate.
- Not touching the three hook route files — their auth check is correct.

## Risk
Low. Rotation happens in one turn; cron catches up on the next scheduled tick (≤1h for reengagement, next 03:17 UTC for mirror-evolution).
