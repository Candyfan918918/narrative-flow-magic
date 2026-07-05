## Plan: email preferences + tokenized unsubscribe

### 1. Database migration (schema)
Extend `public.profiles` (no new table — aligns with existing user record):
- `email_prefs_token text unique` — random 32-byte base64url, generated lazily on first email send.
- `notif_all_opt_out boolean not null default false` — one-click unsubscribe flip.
- `notif_checkins_opt_out boolean not null default false` — engagement (check-in series).
- `notif_community_opt_out boolean not null default false` — engagement (new_reply, milestone).
- `notif_digest_opt_out boolean not null default false` — nontransactional (digest, popular_today, hall_updates, reengagement).
- Partial unique index on `email_prefs_token where email_prefs_token is not null`.

No new RLS needed (server routes use `supabaseAdmin` — routes are public-visitor + token-authed).

### 2. New server module `src/lib/email/prefs.server.ts`
Uses `supabaseAdmin` (loaded dynamically) — never imported by client code.
- `ensureEmailPrefsToken(email)` → `{ userId, token, prefs } | null`. Looks up profile by email (case-insensitive), generates token if missing, returns current prefs.
- `getPrefsByToken(token)` → `{ userId, email, prefs } | null`.
- `updatePrefs(token, patch)` → boolean.
- `unsubscribeAllByToken(token)` → boolean (sets `notif_all_opt_out = true` and all three group flags true).
- Token = `crypto.randomBytes(32).toString('base64url')`.

### 3. `src/lib/email/render.ts`
- Remove `DEFAULT_UNSUB = 'https://shutap.com/profile#notifications'`.
- If `unsubscribe_url` / `preferences_url` missing from vars → leave empty (send layer supplies them per-recipient). Text-footer only prints the line when a URL is present.

### 4. `src/lib/email/send.server.ts`
- New optional param `SendOpts.crisisFlagged` remains as caller override; other flags become derived defaults.
- Before render:
  1. `ensureEmailPrefsToken(to)` — best-effort; if profile not found (e.g. test address), send with empty prefs (transactional only path unaffected).
  2. Build `https://shutap.com/email/unsubscribe?token=…` and `…/preferences?token=…`, inject into vars unless caller supplied.
- Enforcement matrix (only applies when `emailClass !== 'transactional'`):
  - `notif_all_opt_out` → suppress everything (engagement + nontransactional).
  - `notif_checkins_opt_out` → suppress `checkin_day*` (engagement).
  - `notif_community_opt_out` → suppress `new_reply`, `milestone` (engagement).
  - `notif_digest_opt_out` → suppress `digest`, `popular_today`, `hall_updates`, `reengagement` (nontransactional).
  - Caller `crisisFlagged` still suppresses engagement + nontransactional.
- Add Resend `headers` on non-transactional sends:
  - `List-Unsubscribe`: `<https://shutap.com/email/unsubscribe?token=…>`
  - `List-Unsubscribe-Post`: `List-Unsubscribe=One-Click`

### 5. Routes (public, top-level, `noindex`)
- `src/routes/email.unsubscribe.tsx`
  - `createServerFn` `POST` `processUnsubscribe({ token })` → calls `unsubscribeAllByToken`.
  - Loader (public) reads `?token=`, invokes the fn, passes result to component.
  - Renders minimal branded page (cream `#fdfcfb`, shutap wordmark, "you're unsubscribed. transactional and security emails may still arrive." + link to preferences with same token).
  - `head()` adds `<meta name="robots" content="noindex,nofollow">` and page-specific title.
- `src/routes/email.preferences.tsx`
  - Server fns: `loadPrefs({ token })` and `savePrefs({ token, patch })`.
  - If token missing/invalid → render sign-in CTA that links to `/auth?next=/email/preferences` (no auto-token creation; signed-in flow deferred — out of scope here, CTA-only).
  - If valid → three toggles (check-ins / community / digests) with save button; success toast.
  - `noindex` meta.

### 6. Router bootstrap
No change to `src/start.ts` — server fns already covered. `/email/*` paths are public top-level routes, not under `_authenticated`, so no auth gate applies.

### Files to change / create
Create:
- `src/lib/email/prefs.server.ts`
- `src/routes/email.unsubscribe.tsx`
- `src/routes/email.preferences.tsx`
- migration (via `supabase--migration`)

Edit:
- `src/lib/email/render.ts` — drop hardcoded default.
- `src/lib/email/send.server.ts` — recipient lookup, URL injection, enforcement, List-Unsubscribe headers.

Verify: `bunx tsgo --noEmit` clean.

### Notes / assumptions
- Random-token column chosen over HMAC: no dependency on a server signing secret, one-column schema change, token is opaque and revocable per-user (rotate by nulling the column).
- Preferences page for anonymous visitors without a token intentionally shows only a sign-in CTA — building the authed self-serve flow would require touching `_authenticated/` and is not requested.
- Test/non-user recipients (e.g. `whatcandyeats@gmail.com`) will get empty `unsubscribe_url`/`preferences_url` since no profile row exists; `<tr>` strip rules already drop the footer row cleanly.
