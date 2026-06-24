# Handoff: Shutap v2 — full product (pseudonymous support community)

## Overview
Shutap is a **pseudonymous support community** where people vent about relationships, marriage, family, and work — and see what actually happened next for people who lived the same thing. The product is built around being *heard*, not judged. There are no verdicts, no jury, no real names. An AI persona called **the companion** (a pair of eyes) helps people put words to what they're carrying and orchestrates intake, navigation, safety, and sharing.

The locked entity sentence (use verbatim in metadata/marketing):
> **Shutap is a pseudonymous community where people vent about relationships, marriage, family, and work — and share what actually happened next.**

This bundle covers the entire app: onboarding/auth, the feed and room experience, the verdict-free reactions + comments, the Hall of Fame, the Profile/Settings, the **Mirror** (the premium subscription feature), an Admin console, and two cross-cutting engines (companion-initiated sharing, seed data).

## About the design files
The files in this bundle are **design references created in HTML** — high-fidelity prototypes that show the intended look, copy, motion, and behavior. They are **not production code to ship directly.** Each page is authored as a self-contained HTML file with an embedded logic class (vanilla JS). The AI calls use a browser-injected `window.claude.complete(...)`; every AI surface has a deterministic fallback baked in.

**Your task:** recreate these designs in the target codebase's environment, using its established patterns. If no codebase exists yet, the recommended stack is **React + TypeScript** (SPA with client routing) for the app, a **Postgres** datastore (schema sketched below), and a server-side **entitlement service** for subscriptions. Treat the HTML as the source of truth for *visual + interaction* detail and this README as the source of truth for *behavior, state, and the AI contracts.*

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, motion, and interaction states are all intentional. Recreate the UI pixel-close using the codebase's component library. The brand voice in copy is deliberate — preserve it (see Voice below).

---

## Design tokens

### Color
| Token | Hex | Use |
|---|---|---|
| bg | `#fdf0f5` | app background (warm blush) |
| bg-alt | `#fcf1f5` | alt panels |
| ink | `#0b080f` | primary text |
| ink-2 | `#2e0a1a` | headings on blush |
| accent | `#c1216b` | primary pink (links, CTAs, markers) |
| accent-deep | `#890041` | hover/pressed pink |
| accent-soft | `#e7548a` | secondary pink (companion, glow) |
| muted | `#6b4a5c` | secondary text |
| muted-2 | `#9e7a8c` / `#967f8e` | tertiary text |
| hairline | `rgba(11,8,15,.08)` | borders/dividers |
| dark-surface | `#170b13` / `#1a0a12` | Mirror + dark overlays |

**Mood colors** (the four supportive modes): sit `#b0457a` · view `#4a8c6e` · ask `#d99a2b` · thru `#7F77DD`.

**Drama/intensity score bands** (Scan, 0–999): 0–199 gray `#888780` · 200–499 purple `#7F77DD` · 500–699 coral `#D85A30` · 700–899 amber `#EF9F27` · 900–999 red `#E24B4A`.

### Typography
- **Sora** — display + UI (weights 400–800). Headings, labels, buttons, badges.
- **Newsreader** *(italic, opsz 18)* — the companion/Mirror voice and reflective prose. Always italic for "voice."
- **Inter** — body text, comments, form fields.

Type floor: never below ~13px on mobile UI; body 15–16px; hero display clamps `clamp(30px,6vw,50px)`.

### Radius / shadow / motion
- Radius: pills `999px`; cards `14–18px`; tiles `12px`.
- Card shadow: `0 1px 3px rgba(0,0,0,.06)`; floating elements use soft pink-tinted glows.
- Motion: enter animations 0.4–0.8s ease-out; the companion + Mirror orb **breathe** (pulse keyframes); graphs animate on reveal (arc draws, bars grow, belonging field fills dot-by-dot).

### Banned UI patterns (product rules — keep these)
- **No verdict/jury/judgment language** anywhere (copy, meta, schema). Promise *control* instead ("your story, your rules").
- **No category filter chips / search bar / category tabs.** Finding, filtering, and browsing are **the companion's job** — natural-language input reshapes the stream (see Companion search).
- **No emoji as decoration** beyond the four moods + the four service icons + channel logos in share.
- **No standalone "share" buttons** as the primary mechanic — share is companion-initiated at emotional peaks (a quiet manual fallback is allowed).
- Bottom-nav must **not** contain the Mirror — it's reached only through the companion + Scan reveal + profile corner.

---

## The companion (cross-cutting)
A floating, **draggable** circular bubble showing the brand eyes (semi-transparent pink, no border), present on **every page**, position persisted in `localStorage` (`shutap_bubble`). Tapping it (without dragging) opens the companion composer/Ask flow; on secondary pages it routes to `Landing#ask`. The companion **breathes** (pulse animation). It never carries a permanent badge — it speaks in **words only when it has something true to say** (see Notifications + Mirror bubble rules).

### Voice (preserve exactly)
Warm, perceptive, short, a little witty, never clinical, never cruel. Lowercase, intimate. Examples:
- "something's been sitting with you. you showed up anyway. tell me — what happened?"
- "that's a lot to carry alone. i want to make sure i understand it properly. can you tell me more about [X]?"
- "one last thing before the room hears this: are you looking for advice — or mostly just to be heard?"
- "three people just found their 'omg same' moment. wondering if yours is still out there."

---

## Screens / Views

### 1. Welcome — `Welcome.dc.html` (auth + onboarding)
**Purpose:** the only path to an account. Sign in (Google/Apple/email) → **18+ age gate** (birthday spinner; the day options update daily so "today" is always the 18-years-ago boundary) → **alias ceremony** (a slot-machine that rolls an emotion + nationality + creature into one persistent alias, e.g. "🦉 Quiet Indonesian Owl"). Real name never enters the product.
- **Return-to:** any gated action stores its intent in `sessionStorage` (`shutap_returnTo`, including a `#spill`/`#scan`/`#ask` hash). After the ceremony, redirect back to exactly where the user came from and auto-open that flow.
- **Emotional contract** (shown once, first session): "this is where you're heard. advice only if you ask. real people, no judging."
- Persists: `shutap_alias` (`{name, emoji}`), `shutap_seen_contract`.

### 2. Landing — `Landing.dc.html` (the hub)
**Purpose:** the home: featured live room, the stream preview, the two ways in, HOF preview, and the hub for **Spill, Scan, Mirror, the companion composer, and notifications.** Header has logo + nav (rooms, hall of fame) + auth area (avatar menu when logged in: *your profile · settings · sign out*; **admin** only if `isAdmin()`).
- **Hero:** entity-sentence subhead; two balanced CTA cards — **spill it** (pink gradient, "opens a room") and **scan it** (white, "a private read"). Any action while logged out routes through Welcome.
- Contains the full overlay flows for Spill, Scan, Mirror, the companion composer, the identity ceremony hooks, and the onboarding contract.

### 3. Stream — `Stream.dc.html` (feed + room detail)
**Purpose:** browse open rooms as a **Xiaohongshu-style waterfall** of tiles (gradient cover, creature avatar, mood badge, title, relate/sitting counts). Tapping a tile opens the **room detail page** (`#room-<id>`, full-viewport, locks background scroll) with the teller's account, **presence seats**, **reactions**, **add-your-side**, **share**, and the **AI-guided comment thread**.
- Per-room `DiscussionForumPosting` JSON-LD is injected on open (SEO); page title set to the story.
- The companion bubble + NL composer ("talk to the room…") reshape the feed.

### 4. Room — `Room.dc.html` (standalone room showcase)
A self-contained demo of the full room experience (fixed story): **dynamic presence seats** (avatars pop in over time with a "+ just sat down" toast), reactions, add-your-side, and the guided comment composer. Same vocabulary as the Stream room detail. (In production, Stream's `#room-<id>` is the real data-driven room; Room.dc.html is the reference for the room component.)

### 5. Hall of Fame — `HallOfFame.dc.html`
**Purpose:** "rooms the world remembered," across **6 halls** (Most Loving 🤍 · Bravest 💪 · Most Healing 🌿 · Most Relatable 🫂 · Hardest-Won 🪨 · Funniest 😭) × **time windows** (daily / weekly / all-time). Rows are ranked with bands (held / honored / legend) and are **clickable** → open the source room (`Stream#room-<id>`). Reshaped by the companion, not chips. Arriving with a `#<hall>` hash opens that hall.

### 6. Profile & Settings — `Profile.dc.html`
**Purpose:** the pseudonymous standing + the private account home. Identity card (alias, two-identity model copy), **standing bars** (Support/Kindness, Empathy, Wisdom), a **Mirror** entry (the private counterpart, part of the wisdom graph), and the **six settings screens**: Identity · Account · Notifications · Privacy & safety · Data · **Subscription**. Subscription screen shows plan/status/renewal + change/restore/cancel (honest copy; cancel as easy as subscribe).

### 7. Admin — `Admin.dc.html`
**Purpose:** internal console. Governing banner ("no real identities are stored — moderation is content-only, redact-not-reveal"), **moderation queue** (live signals from the Spill Guardian/Privacy-Shield scan), **analytics**, and a **platform-config** screen. Access gated to admins only.

---

## Interactions & flows (behavior contracts)

### Spill (guided intake → opens a room) — Landing
One question at a time. **First question is hardcoded** ("what happened?"); subsequent questions are generated by `window.claude.complete` from the running transcript (fallback questions in `benchFallback`/companion fallback). After ~8 turns the companion composes a structured, **editable** draft `{case_title, question_before_court→question, body, players}`.
- **Privacy Shield (rule-based):** regex-flags identifiers (names, @handles, phone, email, addresses) inline before publish; redact-not-reveal.
- **Guardian gate (AI + rules):** runs between support-mode selection and publish. If the content reads as crisis, **intercept** — show a calm resource card (988 / Samaritans / findahelpline) + a private-draft route. **Never auto-publish, never monetize crisis.**
- Support mode choice ("advice or just to be heard?") is attached to the room and tunes the comment-composer prompts.
- Enter submits (Shift+Enter = newline) on all inputs, app-wide.

### Scan (private read → 0–999) — Landing
9 tap-card questions, weighted → score with a **count-up** reveal + a per-situation **signature** + a short companion summary (in voice). Service cards (therapy / paper-trail) surface on signal. **Two equal exits:** *save privately* (journal/Mirror) or *post to feed* (seeds a Spill). Every Scan **feeds the Mirror** (each scan = a brushstroke). On a notable positive signature, fire share trigger **T1** (see Sharing).

### Companion search / NL navigation — Landing + Stream
The composer ("talk to the room…") is the **single** entry point for finding/filtering/browsing. Architecture (non-negotiable):
```
utterance → COMPANION(LLM): parse intent → STRUCTURED QUERY (filters, sort, scope, window)
          → RETRIEVAL(deterministic): run query against the real room corpus
          → real rooms returned
          → COMPANION(LLM): write ONE warm framing line over the real results
          → UI: the STREAM reshapes to those tiles (never a chat list of invented rooms)
```
The companion **never invents rooms.** Output is the reshaped stream, not a chatbot answer. Empty results are honest ("no open marriage rooms in Lagos right now — here are recent nearby ones. widen it?"). **Crisis is not search:** an utterance that reads as crisis routes to the Guardian/resources, never returns "rooms." Personal-history queries are private-scope (asker's own data only). A thin deterministic fallback nav (my history, saved rooms, the halls) exists for a11y/reliability.

### Room: presence, reactions, relate, comments
- **Presence seats:** your alias avatar seats first (green presence dot); a live crowd of creature avatars pops in over time ("and N more"), with a "+ just sat down" toast. Dynamic, never static.
- **Reactions** (verdict-free): i hear you / omg same / you've got this / it gets easier / so brave. Any reaction fires the companion share offer (T4-style) subject to caps.
- **Comments:** always-open, **AI-guided** composer. The companion writes a one-line nudge tuned to *this specific story* (content + advice/heard mode) and offers starter chips + pre-populated content; each comment has *🤍 felt this* + count and *reply* with inline reply box.

### Notifications (the returning-user loop) — Landing
Woven into the companion (no 2000s standalone bell). The companion bubble carries a small unread heart; tapping it surfaces a **"while you were away"** peek in the companion's voice, **batched** ("12 people sat in your room today · 3 said they've been there"). Each unread is tappable to mark read (badge decrements; clears at zero); "mark all seen" clears all. Re-engagement is **honest** — real warmth that happened, never manufactured, never streaks/FOMO. T&S notices ride a separate transactional track the user can't mute.

### The Mirror (premium subscription) — Landing (+ Profile entry)
A private, **breathing, support-led living analysis** of the user, generated from their own spills/scans/community activity (never a template — a different person sees a different Mirror). It **reflects through gentle, therapist-style questions and never advises.** Reached **only** through the companion, the Scan reveal ("this is one moment — your companion sees the whole pattern"), and the profile corner — never a nav tab. It **absorbs the old Journal** (one private home).

**Form (locked):** a breathing orb (the eyes + aura), then **"the shape of you, right now"** (the forming signature line). Content blocks (all reflective): Signature · Patterns · Arc · Instincts · Today's reflection · The Pull (daily ritual) · Threads · Growth markers · "People who've been here" (Wisdom-Graph aggregate). Graphs **animate** on reveal (arc draws itself; belonging field fills dot-by-dot — "you, one glowing dot among 312 who walked it"). Each reading carries a **movement marker** vs last visit (softening ↓ / rising ↑ / steady / deepening / present) — the "since you last looked" layer is the retention lock and **paid-only**.

**Free vs paid (THE monetization boundary):**
- **FREE Mirror** = exactly one reading, *"the shape of you, right now"* (the forming signature) — warm, true, complete, a genuine gift (never a crippled teaser). Everything else renders as a **covered mosaic** (titles/shapes faintly visible, content obscured) with one pay button. Always free regardless of plan: venting, Scan, being heard, community, and **crisis routing** (incl. crisis detection inside the speak channel — safety is never gated).
- **PAID Mirror** = the mosaic lifts: every reading open, animated/interactive analytics, the breathing "since you last looked" layer, the **speak-to-the-mirror** channel, personalized reflective questions, the **de-identified shareable growth report**, cohort calibration.

**Bubble rules (when the companion mentions the Mirror):** first pop on a *threshold* (a connectable pattern forms, realistically a few scans in) — "i've been noticing something. want to see?"; on connect/shift/arc events; post-Scan contextually; soft weekly beat (subscribers). **Never** on a timer, mid-vent, during/after crisis, to manufacture FOMO, or again on a dismissed prompt. Test: *"i noticed X about you"* earns a pop; *"you have unread insights"* never does.

**Speak-to-the-mirror channel (paid; a full-screen therapeutic session, not a chatbox):** a calm full-screen space; the Mirror **speaks first** and offers tappable, data-derived prompts that refresh after each reply. Wired to `window.claude.complete` with a **therapist/supportive-friend** system prompt (distinct from the companion). **CRISIS ROUTING IS MANDATORY + ALWAYS-ON for everyone:** a distress message must break character and route to real free human help (988/local) — never a poetic reflection or a question. Replies must be grounded in the user's real signals, never invented.

**Reflect-never-advise — hard constraints (bake into the Mirror engine's prompts):**
- Observation, not instruction: "here's what keeps showing up" / "you tend to" — never "you should" / "you need to" / "the answer is."
- Reflect the user's own words back; never introduce outside conclusions.
- Describe, never diagnose: no clinical or legal labels ("anxiety," "toxic," etc.).
- Lived-experience data, not counsel: "people who've been here said…" not "what you should do is…".
- Route, don't treat: genuine distress → surface real free resources only.
- The friend test on every output: would a thoughtful non-therapist friend say this? If it diagnoses/prescribes/labels → rewrite.
- Visible disclaimer: "the Mirror reflects patterns in your own words — it's not therapy or legal advice." (Exact wording is jurisdiction-dependent — legal review before launch.)

### Companion-initiated sharing — `share-engine.js` (cross-cutting)
Replaces static share buttons. The companion catches a **positive-valence peak** and hands over a finished **pop-up share card** (slide-up sheet): pre-rendered de-identified artifact + one-line companion offer + pre-filled editable caption + share targets + "not now" + a "take yours →" loop hook. The user's only decision is yes/where.
- **Global rules:** a **valence gate** runs first — fire only on pride/relief/resonance/fun/growth; if heavy/painful/crisis-adjacent, **never** offer. Artifact is always about the *sharer* or a *safe aggregate* — never someone else's raw story. Privacy shield runs on every artifact. Teller consent for any room-derived unit.
- **Frequency:** at most one offer per session + a low daily ceiling; never back-to-back; suppress a just-dismissed trigger (cool-down); learn from repeated dismissals.
- **Triggers (T1–T12):** T1 Scan score reveal (hero/highest volume), T2 Signature reveal, T3 Signature shift (growth-framed), T4 first relate ("not alone"), T5 resonance milestone, T6 reached a Hall, T7 good outcome, T8 growth marker, T9 arc turned lighter, T10 weekly mirror (subscriber), T11 Hall/outcome-stat browsing (aggregate, doubles as GEO asset), T12 after being helped (invite). Expect T1 + T4 to lead.
- **External channels use real brand logos + colors:** Messages (green), X, WhatsApp (green), Instagram (gradient), TikTok (black), plus native share + copy-link. Caption pre-written in the speak-up voice.
- **Fallback:** a quiet manual share affordance remains (room overflow + Mirror) — fallback, not the strategy.

### Seed data — `seed-data.js`
44 synthetic rooms (from `invented_stories.json`) with aliases, moods, support modes, reactions, relate/sitting counts, reflections, generated comments, and a computed Hall of Fame across the 6 halls. **Synthetic, flagged `is_seed: true`** for clean teardown. **Ethics note for launch:** seed only with synthetic, clearly-flagged content; do not present fabricated stories or fabricated engagement as real users (FTC-deception + trust risk). Replace with real, consented stories as the community grows. (`real_stories.json` in uploads was deliberately **not** used for production — copyright/TOS/deception exposure.)

---

## State management & persistence
All client state is `localStorage`/`sessionStorage` in the prototype; in production move identity/entitlement/server-truth server-side. Keys used:
- `shutap_alias` — `{name, emoji}`, the pseudonymous identity (gate for "logged in").
- `shutap_bubble` — `{x, y}` companion bubble position.
- `shutap_seen_contract` — onboarding contract shown once.
- `shutap_returnTo` (session) — post-auth redirect target incl. intent hash.
- `shutap_sub_status` — Mirror entitlement state (`free`/`trialing`/`active`/`grace`/`canceled`/`expired`). **In production the client must NOT decide entitlement** — server is source of truth.
- Share engine: per-session + per-day counters and per-trigger cool-down/dismissal memory.
- Notifications: per-item read flags.
- (Decks aside — N/A here.) Never clear keys you didn't write.

**Mirror access states:** `free → trialing → active → (grace) → canceled(until period end) → expired → free`. trialing/active/grace/canceled-until-end → FULL Mirror; free/expired → FREE Mirror (shape-of-you + covered mosaic). Crisis detection in the speak channel stays on regardless. All scans/patterns/history/signature are retained across cancel — re-subscribe lifts the mosaic instantly.

---

## Suggested data model (extends the prototype)
```
users            (id, created_at, is_admin)        -- NO real-name/PII tied to content
aliases          (user_id FK, emotion, nation, creature, emoji, display_name)
rooms            (id, user_id FK, title, body, category, tone, support_mode, region, state, created_at, is_seed)
players          (id, room_id FK, label)            -- de-identified actors in a story
reactions        (id, room_id FK, user_id FK, kind) -- hear/same/gotthis/easier/brave
relates          (id, room_id FK, user_id FK)       -- "omg same"
comments         (id, room_id FK, user_id FK, body, parent_id, created_at)
comment_felt     (comment_id FK, user_id FK)
presence         (room_id FK, user_id FK, last_active_at)
scans            (id, user_id FK, score, signature, answers_json, created_at)
story_tags       (story_id FK, tag)                 -- for retrieval + "rooms like mine" (vector index)
halls            (room_id FK, hall, window, rank, band, resonance)
outcomes         (id, room_id FK, kind, body, created_at)  -- 30/90/180/365 reminder loop

-- subscriptions / entitlements (server is source of truth)
subscriptions    (id, user_id FK, platform ENUM(ios,android,web), product_id, plan ENUM(monthly,annual),
                  status ENUM(trialing,active,grace,canceled,expired), trial_end, current_period_end, store_txn_id, ...)
entitlements     (user_id FK, feature DEFAULT 'mirror', active BOOL, source, expires_at)
payment_events   (id, user_id FK, provider ENUM(apple,google,stripe), type, raw_ref, created_at)  -- APPEND-ONLY

-- mirror engine
mirror_state     (user_id FK, signature, signature_confidence, last_built_at)
mirror_patterns  (id, user_id FK, label, kind, occurrences, first_seen, last_seen)
mirror_threads   (id, user_id FK, story_id FK, status, next_checkin_at)
mirror_pulls     (id, user_id FK, card_ref, pulled_on)   -- one/day

share_assets     (id, user_id FK, trigger, artifact_ref, og_ref, deidentified BOOL, created_at)
```

## AI agents (server-side in production)
1. **Companion** — voice + intent-parsing + one-line framings. Never invents rooms; warm, short, lowercase.
2. **Guardian / Privacy Shield** — crisis detection + identifier redaction at publish (rules + LLM). Crisis → resources, never publish.
3. **Mirror engine** — distinct analysis agent over the user's own data → `mirror_state`/`patterns`/arc/threads; "people who've been here" from the Wisdom Graph; prompt hard-codes the reflect-never-advise constraints + the friend test. The companion narrates its output.
4. **Mirror speak channel** — therapist/supportive-friend reflective voice; mandatory always-on crisis routing; grounded in real signals.
5. **Share engine** — valence gate + frequency caps + trigger catalog; artifacts de-identified + privacy-shielded.

All five must enforce: never advise/diagnose/label in reflective surfaces; crisis routing everywhere the AI speaks; never paywall pain or crisis.

## Payments & compliance (build with counsel)
- App never stores raw card data. Mobile → Apple IAP + Google Play Billing (+ Restore Purchases); Web → Stripe Billing/Checkout + portal. Unified entitlement service ingests validated receipts + provider webhooks (append-only `payment_events`) as server truth; receipt validation server-side.
- Anti-dark-pattern: cancel as easy as subscribe; clear trial disclosure (length, first-charge date, price) before purchase; no FOMO/guilt UI; never monetize crisis. Auto-renewal/consumer-protection law + app-store policy + the reflection-vs-licensed-advice line need legal review before launch.
- **No licensed-professional/therapist referral at launch** (regulated-referral exposure). Human support is peer/community only; crisis routes to free public resources.

## SEO / GEO / AEO (already in the prototype)
- Locked entity sentence identical across `<title>`, meta description, `Organization` + `WebSite` schema, and `llms.txt`. Tagline "Shutap. Speak up." in OG/Twitter. No verdict/judgment language anywhere.
- `llms.txt` (at repo root) describes the product for AI engines (concepts, who it's for, what it's not, outcome-data moat).
- Per-room `DiscussionForumPosting` JSON-LD on room open; `FAQPage` + `SearchAction` on Landing.
- Still to build (route patterns): situation hubs (`/is-it-normal/[slug]`, QAPage schema, answer-first), outcome/data pages (`Dataset` schema), pillar hubs, and an "index only with unique aggregate data" gate.

## Assets
- **Brand eyes / companion mascot** — inline SVG (`#eyeG`/`#pupG` radial gradients, blinking/breathing). Reference: `assets/eye-mascot.svg` + each page's `eyeSVG()`/`companionSVG()`.
- **Channel logos** — inline SVG brand marks in `share-engine.js` (Messages, X, WhatsApp, Instagram, TikTok) with brand colors.
- **Fonts** — Sora, Newsreader (italic opsz 18), Inter via Google Fonts.
- No raster assets; everything is SVG/CSS.

## Files in this bundle
- `Landing.dc.html` — hub: login routing, Spill, Scan, Mirror, companion composer, notifications, hero, stream + HOF previews.
- `Welcome.dc.html` — auth + 18+ age gate + alias ceremony + return-to.
- `Stream.dc.html` — feed waterfall + room detail (presence, reactions, comments, share) + per-room schema.
- `Room.dc.html` — standalone room component reference (dynamic seats, guided comments).
- `HallOfFame.dc.html` — 6 halls × time windows, clickable rows, hash-routing.
- `Profile.dc.html` — standing + the six settings screens incl. Subscription + Mirror entry.
- `Admin.dc.html` — moderation queue, analytics, config; admin-gated.
- `share-engine.js` — companion-initiated share engine (valence gate, caps, T1–T12, brand-logo targets).
- `seed-data.js` — 44 synthetic seed rooms + computed HOF (`is_seed: true`).
- `llms.txt` — GEO/AEO description for AI engines.
- `styles.css`, `tokens/` — design tokens (color, type, spacing) extracted as CSS custom properties.
- `support.js` — the runtime that renders the prototype's logic classes (reference only; not needed in production).

> Note: the `.dc.html` files embed their logic as a vanilla-JS class. Read each file's class for exact thresholds, weights (Scan scoring), regexes (Privacy Shield), and copy — this README documents the contracts; the files are the precise reference.
