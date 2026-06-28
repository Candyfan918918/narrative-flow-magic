## Goal
Verify Spill v2 works end-to-end: interview turns → AI compose → preview → publish to room OR keep as journal, with a real `situations` row created and the user landed on the right destination.

## Approach
Drive the live preview with headless Playwright against `localhost:8080`, using the pseudonymous-first session bootstrap (root route auto-creates an anon Supabase session), so no manual login is needed.

## Steps

1. **Pre-state snapshot (DB)**
   - `supabase--read_query` on `public.situations`: capture max `created_at` and a count, scoped to a fresh anon user we're about to create.

2. **Scenario A — Publish to a room**
   - Launch Chromium (1280×1800), goto `/`, wait for the landing iframe + anon session to settle.
   - Open Spill, type the seed line from the session replay ("I cannot afford to see a doctor"), step through 3–4 interview turns answering the bot until it returns `decision: "ready"`.
   - Screenshot the chat at each turn to confirm 1–3 short bubbles, react-before-question, no banned phrases.
   - On preview: screenshot the composed title/body/tags, confirm editable.
   - Choose "post to a room" → wait for `postMessage` round-trip → assert URL becomes `/stream#room-<uuid>`.
   - Screenshot the resulting room tile.

3. **Scenario B — Keep as private journal**
   - Fresh browser context (new anon user), repeat the interview with a different seed.
   - Choose "keep as journal" → assert URL becomes `/profile` and journal entry is visible.

4. **Post-state verification (DB)**
   - `supabase--read_query` on `public.situations` for the two new rows:
     - Row A: `is_public = true`, `room_id` not null, `body` populated (composed, not raw transcript), `kind`, `support_mode`, `pillar`, `tags`.
     - Row B: `is_public = false`, `room_id` null, `body` populated.
   - Query `public.rooms` for Row A's `room_id` to confirm the linked room exists with matching title/body.

5. **Report**
   - Pass/fail per scenario with screenshots and the actual DB row contents.
   - Flag any banned therapy-speak in bot bubbles, any failed bridge calls (console errors / 401s), and whether navigation happened from React (`Landing.tsx`) vs the iframe.

## Notes
- No code changes; read-only verification.
- If a bridge call 401s, it likely means the anon-session bootstrap in `__root.tsx` hasn't landed before the user clicks publish — I'll capture the timing in the report rather than patch.
