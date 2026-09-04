# Joke cards become the landing page

The home page turns into the joke-card surface from your prototype: type what happened, get three face-down cards, flip one and keep the line that lands. Everything is wired to the real backend — no localStorage stand-ins, no prototype controls panel.

## What the page does

Order on `/`: hero → one open text box → the set (after submit) → your set list → paywall line → the Spill / Scan / Mirror chapters → rooms → FAQ → support → finale. `/mirror` renders the same core surface and keeps its address.

- Hero: `shutap. joke about it.` / `life's a bitch. so make fun of it.` Nothing between hero and the box. Any "someone always replies" promise is removed from the page, the title, the description and the sharing tags.
- One textarea, no category tabs. Once you've typed, a small `✦ reading this as <Archetype>` line appears with a `not right?` reset to `general`.
- On submit: scrub personal details (existing scrubber) → safety check → archetype match (6 in-law archetypes + general) → draw 3 of the 7 angles, no repeats → create the set → three face-down cards appear in place. Nothing is written by the model yet.
- Crisis path: support response only. No set, no cards, no paywall, no sign-up prompt. Always free.
- Per flip: identity and entitlement are resolved on the server and the day's counter is incremented *before* the model runs, then generate (angle prompt + archetype flavour + hall-of-fame examples) → judge → one retry → authored fallback for that angle. A flip can never land empty; latency is covered by the flip animation and a `shuffling…` state.
- Guardrails on every line: no advice phrasing, no clinical words, max 16 words / under 110 characters. The card roasts the situation and the other person's behaviour, never the user, never a real name.
- All 7 angle fragments, all 7 authored fallback pools and the hall-of-fame lines are ported verbatim.

## Tiers (resolved server-side every request)

- Guest: unlimited entries, 3 cards per set, 1 flip a day. The flipped line is returned and shown but never stored, and the card says `this one's not saved.` The scrubbed entry text is stored.
- Signed-in free: unlimited entries, 1 flip a day, and that card is kept forever — shareable and downloadable.
- Paying: all 3 cards per set, up to 3 sets a day, plus everything the Mirror already gives. Nothing is removed.

Entries are never capped — only flips.

## Where the wall is

Free: entering a situation, the first flip of the day, spill, scan, crisis routing.

Wall raises when a guest tries a second flip that day, or taps share / download / post-to-a-room / keep. A signed-in free user out of flips sees the paywall line in place — one line, in voice, not a modal. Share, download and post-to-a-room are always rendered for guests (no blur, no locks); tapping raises the sheet, and the copy is `wanna keep this one? →`.

Sign-in sheet: bottom sheet over the current screen, email magic link / OTP through the existing auth and Resend from hello@shutap.com. No password, no social. One 18+ / terms checkbox, stamped as accepted terms version and time. Dismissing leaves the card intact.

After sign-in, in order: mint the pseudonym (Adjective + Nationality + Animal + glyph, randomised with a uniqueness retry) → claim the guest session's sets in one transaction and clear the anon id → persist the held card and fire its memory signal → merge today's flip counter (so signing in does not mint a fresh allowance; the resumed flip is a one-time grant, 1 → 2, then done) → resume the action that raised the sheet.

## Post to a room, download, memory

- `◎ post to a room` beside share and download. Posting creates a real room (`is_seed = false`, `source = joke`) badged `🃏 joke` in the rooms strip. Confirmation never promises a reply.
- Download is a server-rendered PNG through the existing Scan share-card image path, carrying the SHUTAP mark. The prototype's canvas stand-in is dropped.
- Every signed-in entry (post-scrub) and every kept card writes a signal and runs the existing embed → match pipeline, with its own source glyph `🃏 Joke`. Guests produce no memory and no set list.

## Chapters and the two bugs

Chapters stay as they are, with their self-playing demos intact (Spill interview loop, Scan flow, Mirror full read). Carried-over robustness fixes: never reset a displayed count to 0; commit the Mirror ring/sparkline reset with a forced reflow instead of relying on animation frames; the off-screen pause observer defaults to running and treats an unmeasurable viewport as visible.

1. Repeated room author alias: hardcoded demo alias strings in the chapter cards (including "Forlorn Indonesian Crane") are removed; every alias comes from its own row.
2. Mirror demo cards reading `0 all-time signals`: the real seeded figure is rendered and never reset to zero. A genuinely absent figure is hidden, not invented.

## Technical notes

- New tables `joke_sets` and `joke_cards` plus a per-day flip counter table, all created in one migration with GRANTs, RLS and timestamps. `is_seed` defaults true (authored/demo/fallback/hall-of-fame content stays true, excluded from indexing and stories.xml); real submissions set false. `corpus_eligible` defaults false and stays false. A user reads only their own sets/cards; guest sets are readable only by matching `anon_session_id`; all writes go through server functions with the service role.
- Server functions: `submitEntry`, `flipCard`, `claimGuestSets`, `postCardToRoom`, `renderCardPng` — entitlement and counters resolved server-side; no client-claimed tier is trusted.
- Checkout uses the existing `mirror_monthly` / `mirror_annual` lookup keys resolved at runtime; no new products or prices, no hardcoded price IDs.
- PostHog events fire with `tier`: entry_submitted, set_created, card_flipped, flip_refused, share_blocked_signin, download_blocked_signin, post_blocked_signin, signin_sheet_shown, signin_completed, guest_card_claimed, share_completed, download_completed, card_posted_to_room, checkout_started, checkout_completed, trial_started, subscription_active, subscription_canceled, crisis_route_shown. Situation text is never attached.
- Copy register enforced on every new string: no therapy / healing / safe space / clarity / growth / journey / community of support, no "anonymous" for the user, no promise of a human reply.
- Not shipped: the `⚙ prototype controls` panel. Untouched: `/spill` and `/scan`.

## Assumptions

- The daily window is the user's local day resolved from their stored timezone, falling back to UTC.
- Guest identity is a random `anon_session_id` in localStorage; it carries no tier and grants nothing.
- The paywall block links to the existing subscribe flow rather than an inline checkout.
