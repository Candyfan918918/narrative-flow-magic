# Spill v2 + Content Ownership — exactly per the attached specs

You attached `Shutap-Launch-LOVABLE-PROMPT.md` + `Shutap-Updates-LOVABLE-PROMPT.md` and the refreshed `Shutap-Landing.html / Profile.html / Stream.html / Feedback-Admin.html`. The Updates prompt is the addendum that wins where it conflicts with launch. This plan implements both, no creative additions.

## 0. Drop in the refreshed prototypes (visual reference)
- Replace `public/shutap/Shutap-0627.html` with `Shutap-Landing.html` from the upload (and same for Profile / Stream / Feedback-Admin variants under `public/shutap/`). Iframes already point at these.
- Re-inject `ai-bridge.js` so `window.claude.complete` keeps routing to `/api/complete`.

## 1. Data model delta (one migration)
Add to `public.situations`:
- `kind text` (`null | 'scan'`)
- `body text` (the composed in-voice post; distinct from `clean_text` raw transcript)
- `edited boolean default false`
- `deleted_at timestamptz`
- `'deleted'` added to `situation_status` enum

New table `public.comments` (room comments are not yet owned per the addendum's open item):
`id, room_id (→ rooms.id), user_id (→ auth.users.id), alias_id, clean_text, edited bool, created_at, updated_at, deleted_at` + GRANTs + RLS (anyone signed-in can read non-deleted; only author can update/soft-delete).

New table `public.pii_scrub_log` already exists — reuse it; just make sure `comments` writes through the same scrubber.

Fix the security findings flagged in the current scan in the same migration:
- Tighten `aliases` SELECT policy: replace `USING (true)` with `auth.uid() = user_id`, and add a separate narrow policy exposing only `display_name, emoji, pillar` for community reads via a view `aliases_public` (`security_invoker=on`).
- Revoke `EXECUTE` on `schedule_checkins` from `authenticated` (it's an internal scheduler — only `service_role` should call it).
- Replace any remaining `USING (true)` write policies with scoped ones.

## 2. Server functions — `src/lib/situations.functions.ts` (all `requireSupabaseAuth`)
- `runSpillTurn({ transcript, arc, alias })` — one model call per turn, returns the strict JSON contract from §1 of the addendum (`say[], has_question, relief_lever, humor_ok, updated{...arc}, decision, why`). Persona + JSON contract enforced server-side via Lovable AI Gateway (`google/gemini-3-flash-preview`), system prompt loaded from `src/lib/spill-persona.server.ts`. Crisis Guardian + PII scrubber run on every turn.
- `composePost({ transcript, arc })` — returns `{title, body, tags[]}`, re-scrubbed, traceable to transcript, invents nothing.
- `aiEditPost({ situationId, instruction })` — sticky-to-voice rewrite, re-runs PII scrubber, refuses to invent missing facts (asks instead).
- `saveSituation({ kind?, pillar, clean_text, body, title, tags, visibility })` — persists the record (room or journal or scan), returns `{id, visibility}`.
- `listMySituations({ kind?, visibility? })` — drives Profile sections.
- `getSituation({ id })` — load for owner editor.
- `updateSituation({ id, body?, title?, pillar?, visibility?, status? })` — edit, flip visibility, soft-delete. Flips reuse the SAME record (no duplicate). On public→private, hide from Stream + cancel scheduled check-ins. On private→public, re-run resonance.
- `deleteSituation({ id })` — soft delete (`status='deleted'`, `deleted_at=now()`); cancels pending check-ins; honored `DELETE_GRACE_DAYS=7` purge handled by a separate cron later (out of scope here).
- `listMyComments` / `createComment` / `updateComment` / `deleteComment` — same pattern, per the addendum's "open item".

## 3. Landing iframe — wire the spill turn engine + close
In the dropped-in `Shutap-Landing.html`:
- Replace the local `runSpill` orchestrator's per-turn AI call with `fetch('/api/complete'...)` → `runSpillTurn` server fn (via the `ai-bridge` shim). Same strict JSON contract.
- Implement the close exactly: land-it reflection → support-mode prompt → Guardian check → `composePost` → **preview screen** (editable title/body + "edit with spill" instruction box + Post-to-room / Keep-as-journal buttons).
- On "post to a room": `saveSituation({ visibility:'public' })` → postMessage `shutap-nav` to `/stream#room-<id>` (the actual room URL the parent SPA renders).
- On "keep as journal": `saveSituation({ visibility:'private' })` → postMessage `shutap-nav` to `/profile#journal`.
- Scan stays as `kind:'scan'` private situation.
- Cheerful greeting calls user by alias (fetched from `getMyAlias` on iframe boot).

## 4. Profile becomes a real React page
Replace `src/pages/Profile.tsx`'s iframe shell with a React page styled with the prototype's CSS tokens (Sora UI, Newsreader italic, pink) — uses `Shutap-Profile.html` only as visual reference. Three real sections:
- **your rooms** — public situations. Per card: edit-with-spill, move to private journal, delete. Empty-state nudges to spill.
- **private journal** — private situations + scans, newest first, relative timestamps. Per card: post-to-room, edit-with-spill, delete.
- **your scans** — `kind='scan'` rows with band + date + delete.

All actions hit the server fns from §2 via TanStack Query with optimistic UI and proper invalidation.

## 5. Shared editor — `src/components/SituationEditor.tsx`
The compose/preview surface, used by Profile and by Room owner controls. Matches the prototype: editable title + body, tags chip row, "edit with spill" instruction box → preview diff → save / discard. Buttons: Post-to-room / Keep-as-journal / Delete (with undo grace toast).

## 6. Room owner controls
In the room view (`src/pages/Room.tsx`), when the signed-in user owns the situation, the ⋯ menu shows **edit with spill / move to private journal / delete** instead of the report menu. Opens the same `SituationEditor` from §5. Non-owners see the normal public room + (later) comment box.

## 7. Acceptance (copied from the addendum)
- Spill named "spill", greets by alias, opens cheerfully.
- Each turn = 1–3 short bubbles ≤~30 words, `has_question` flag, no paragraphs.
- Interview walks the full arc; lands only after actions+plan beats or soft cap.
- Close composes in user's voice/facts; preview shown before publish.
- User can edit preview by hand AND with AI (voice/facts locked, re-scrubs).
- Post → lands in their new room URL; Save → lands on the journal page.
- Rooms / journals / scans are editable / movable / deletable from Room page and Profile; flips reuse the same record.
- Comments persisted + editable/deletable by author.

## Out of scope this pass
- 7-day hard-purge cron (table column + soft delete only).
- Email/eye check-in scheduler (already exists; this plan just makes sure delete/flip cancels pending ones).
- Mirror paywall changes.
