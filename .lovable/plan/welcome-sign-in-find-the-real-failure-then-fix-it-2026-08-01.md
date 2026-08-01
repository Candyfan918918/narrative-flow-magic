# /welcome sign-in: find the real failure, then fix it

## What the data actually shows

- 692 anonymous sessions vs **7 real accounts**, and the last real account was created **18 Jul 2026** — nothing since.
- `/welcome` got 42 page views in the last 21 days; exactly **one** `sign_in` event, on 16 Jul.
- Retained auth logs contain **zero** `/authorize`, `/callback`, or OTP requests — only anonymous logins and token refreshes. So no visitor's sign-in attempt is reaching auth at all.
- Google, Apple and email sign-in are all enabled on the backend, so this is not a disabled provider.

Two explanations fit that evidence and today we cannot tell them apart: either people never press a sign-in button (pure UX drop-off), or the press fails silently before any network call. The code makes silent failure very possible — the Google/Apple handler awaits the sign-in helper with no `try/catch`, so a thrown error just clears the spinner and shows the user nothing, and there is no telemetry on the button at all. Diagnosis is therefore **unconfirmed** and step 1 is to confirm it.

## Step 1 — Confirm (before any behavioural change)

- Drive the live `/welcome` page in a headless browser on both mobile and desktop viewports: press "continue with Google", and record console errors, popup behaviour, and every outbound request (broker `/~oauth/*`, auth `/authorize`).
- Outcome A: a request goes out and auth responds — the break is in the return trip to `/welcome`.
- Outcome B: nothing goes out — the helper throws or the popup is blocked.
- Report the observed outcome before continuing.

## Step 2 — Never fail silently again

- Wrap the OAuth call in `try/catch`, surface the real message on screen, and log a `sign_in_failed` event with provider + message.
- Emit `sign_in_started` when a button is pressed and `sign_in_completed` when a real session lands, so drop-off is measurable instead of inferred.
- Add a redirect fallback: if the helper returns neither a session nor a redirect within a few seconds, fall back to a full-page provider redirect instead of leaving the user on a dead button.

## Step 3 — Remove the friction on the page

- Keep the sign-in card in the first screen on mobile (currently it sits low, which reads as an empty page).
- Email path currently demands a name before it will send a code; make the name optional (it can be collected later in the ceremony) so the email route is one field.
- Show a clear inline state after a code is sent, and after a failed verification.

## Step 4 — Verify end to end

- Re-run the headless flow: press Google, complete the return to `/welcome`, and confirm the step advances past auth.
- Confirm a real (non-anonymous) row appears in auth users and that `sign_in_started` / `sign_in_completed` both fire.
- If the confirmed cause in step 1 turns out to be in the return trip (token handling on `/welcome`), fix that specific path rather than the button.

## Technical notes

- Files touched: `src/pages/welcome/AuthStep.tsx` (error handling, telemetry, fallback redirect, optional name), `src/pages/WelcomeNative.tsx` (stuck-timer / `checking` state and completion telemetry only), plus the shared welcome layout for the mobile above-the-fold fix.
- No database, RLS, or auth-provider configuration changes — providers are already enabled and no schema is implicated.
- Client tracking stays behind the existing production-host gate, so this does not add preview noise to analytics.
