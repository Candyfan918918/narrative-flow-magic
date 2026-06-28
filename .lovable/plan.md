# Spill v2 + content ownership — exactly per Spill-Agent-Spec.md + Shutap-Updates-LOVABLE-PROMPT.md

Already done (last turn): schema delta (`kind`, `body`, `edited`, `deleted_at`, `status='deleted'`, `comments` table, security tightening), `saveSituation` / `updateSituation` / `deleteSituation` / `composePost` / `aiEditPost` / list/get / comments CRUD, `SituationEditor.tsx`, real `Profile.tsx`.

This plan finishes the rest of both specs, no creative additions.

## 1. Drop in the refreshed prototypes (visual reference)
Copy from `Shutap_0627_Spill2.zip → exports/`:
- `Shutap-Landing.html` → `public/shutap/Shutap-0627.html` (the file the live Landing iframe loads)
- `Shutap-Stream.html`, `Shutap-Profile.html`, `Shutap-Feedback-Admin.html` → `public/shutap/` (visual reference only; Profile is already a React page, Stream stays iframe)

Re-inject `ai-bridge.js` and `auth-sheet.js` references into the new HTML so `window.claude.*` and the Supabase postMessage bridge keep working.

## 2. Turn engine — `runSpillTurn` (replaces the old monolithic `runSpill`)
New `src/lib/agents/spill-turn.functions.ts`, `requireSupabaseAuth`:
- Persona + JSON contract from new server-only `src/lib/agents/spill-persona.server.ts` (full §10a system prompt + few-shot from Spill-Agent-Spec).
- One AI call per turn via Lovable AI Gateway (`google/gemini-3-flash-preview`), strict JSON output (Spill-Spec §3 + Updates §1 schema, including `arc:{what_happened, frequency, feeling, why, talked_to_them, other_attempts, plan}`).
- Inputs: `{ transcript, draft, arc, meta:{turn_index, max_turns:12}, alias }`.
- Pre-call: PII Scrubber + Crisis Guardian on the latest user turn (reuse `src/lib/agents/scrubber.functions.ts` + `guard.functions.ts`). Guardian trip → return safety branch with `crisis_flag` and `decision:"ready"`.
- Server-side post-call validation: enforce `say.length ≤ 3`, total ≤ ~30 words, ban phrases ("sit with that", "hold space", "that's valid", "i hear you", "thank you for sharing", "it sounds like", "that must be hard", "how did that make you feel") — strip/retry once if violated.
- `decision:"ready"` only when arc's action + plan beats are covered OR `turn_index ≥ 12` OR explicit `named_and_landed && quiet user agreement`.

Also add `getMyAlias` server fn so the iframe can greet the user cheerfully by alias on opener.

## 3. Landing iframe → real turn-by-turn loop + preview
Replace the local `runSpill` orchestrator inside `public/shutap/Shutap-0627.html`:
- On boot: `postMessage('shutap-get-alias')` → parent replies with `{display_name, emoji, pillar}` → render Spill opener with alias.
- Each user turn: `postMessage('shutap-spill-turn', { transcript, arc, draft, turn_index })` → parent calls `runSpillTurn` server fn → posts result back. Render `say[]` as 1–3 Newsreader-italic bubbles, last bubble tinted when `has_question`.
- On `decision:'ready'`: render land-it reflection (model `say` already covers it) → support-mode prompt → call `composePost({ transcript, arc })` (already exists) → show **preview screen** (alias header + editable title + editable body + tags + pillar, looks like a real room post).
- Preview controls:
  - Hand edit title/body directly.
  - "edit with spill" text box → `aiEditPost({ id?, currentTitle, currentBody, instruction })`. Since the situation isn't saved yet, add a `composeEditPost` variant that takes `{transcript, currentTitle, currentBody, instruction}` and returns `{title, body, needs_info?}` (re-scrubbed, sticky to voice/facts, invents nothing).
  - **Post to a room** → `saveSituation({ kind:null, visibility:'public', title, body, clean_text, pillar, tags })` → `postMessage('shutap-nav', { to: '/stream', hash: '#room-<id>' })` (route the user into their just-created room — Stream already deep-links via hash).
  - **Keep as journal** → `saveSituation({ kind:null, visibility:'private', ... })` → `postMessage('shutap-nav', { to: '/profile', hash: '#journal' })`.
- Scan path stays: `saveSituation({ kind:'scan', visibility:'private', initial_scan, scan_band })`.

Parent (`src/pages/Landing.tsx`) extends the existing `message` listener to handle `shutap-get-alias`, `shutap-spill-turn`, `shutap-compose-edit`, `shutap-save-situation`.

## 4. Room owner controls — `src/pages/Room.tsx`
- Fetch `situation.alias_id` + current user; when they match, the ⋯ menu becomes **edit with spill / move to private journal / delete**, opening `<SituationEditor />` (already built).
- Non-owners keep the report menu.

## 5. Comments UI on Room (the addendum's "open item")
- Below the room body: list `listComments({ room_id })` with alias header + relative time.
- Signed-in: composer → `createComment` (server already PII-scrubs).
- Author of a comment: inline edit / delete via `updateComment` / `deleteComment` (already built).

## 6. Auto-redirect from Spill close
Already covered by §3's `shutap-nav` postMessage → Landing.tsx → `navigate(to + hash)`. Stream and Profile scroll to `#room-<id>` / `#journal` anchors that already exist.

## 7. Acceptance (lifted from both specs)
- Spill named "spill", greets cheerfully by alias.
- Turn = 1–3 short bubbles ≤ ~30 words, `has_question` flag, banned phrases blocked server-side.
- Interview walks the full arc; lands only after action + plan beats (or 12-turn cap).
- Close composes in user's voice/facts; preview shown before publish.
- Preview editable by hand AND with AI (voice/facts locked, re-scrubbed, asks instead of inventing).
- Post → lands in the new room URL; Save → lands on `/profile#journal`.
- Rooms / journals / scans editable / movable / deletable from Room + Profile; flips reuse the same record (already wired in `updateSituation`).
- Comments persisted + author-editable/deletable.
- Crisis Guardian + Scrubber on every turn AND every save/edit.

## Out of scope this pass (acknowledged in specs)
- 7-day hard-purge cron job (`deleted_at` column + soft delete are in place; cron later).
- MGM share-card injection at close (separate spec).
- Mirror paywall changes.

## Technical notes
- All new server fns: `requireSupabaseAuth`, RLS scopes by `alias_id = auth.uid()`.
- AI calls go through `/api/complete` (Lovable AI Gateway). Persona stays server-only.
- Banned-phrase + brevity validators live in `spill-turn.functions.ts`, not in the client.
- Optimistic UI on Profile via TanStack Query invalidation of `['situations','mine']` and `['room', id]` / `['comments', roomId]`.
