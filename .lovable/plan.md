## Problem

On `/welcome`, clicking **Continue with Google** (or Apple) is slow and shows an alarming red note *"signing you in — guest activity may stay with your guest account."* before the redirect actually happens.

Root cause is in `src/pages/welcome/AuthStep.tsx` `runOAuth()`:

1. Because there's an auto-created **anonymous** Supabase session, the code first calls `supabase.auth.linkIdentity({ provider })` — a network round-trip that on Lovable Cloud almost always fails (manual identity linking is not enabled).
2. On that failure it sets a red `msg` ("signing you in — guest activity may stay with your guest account.") and **only then** calls `lovable.auth.signInWithOAuth(...)`, which does its own round-trip before the browser finally redirects to Google.

So every OAuth click pays: linkIdentity RTT + error render + signInWithOAuth RTT. That's the "extremely slow with the note".

## Fix (single file: `src/pages/welcome/AuthStep.tsx`)

- Drop the `linkIdentity` attempt entirely. Go straight to `lovable.auth.signInWithOAuth(provider, { redirect_uri })` on click — same path a non-anonymous user takes.
- Remove the `anonSession` state + its `useEffect` (`supabase.auth.getSession()` probe) since it's only used to gate the deleted branch. Saves one extra session round-trip on mount too.
- Keep the existing error handling: only surface `msg` if `signInWithOAuth` returns `result.error` (real failure like provider not enabled).
- No change to the email/OTP path, no change to `WelcomeNativePage`, no change to `lovable` integration file, no auth/RLS changes.

## Verification

- Anonymous visitor on `/welcome` clicks **Continue with Google** → redirects to Google immediately, no red note in between.
- Signed-out (no session) visitor: same fast redirect.
- Real failure (provider disabled) still shows the error message from `signInWithOAuth`.
- Typecheck + lint clean; diff limited to `src/pages/welcome/AuthStep.tsx`.
