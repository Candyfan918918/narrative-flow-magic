
# Shutap v2 — full product on Lovable Cloud

Replace the existing v1 (Stream, halls, welcome, room) with the v2 design system and ship the seven pages with real backend logic. Because the scope is large (auth + alias + 18+ gate, Stream waterfall + room detail, 6 halls × 3 windows, Profile + 6 settings + Mirror, Admin, share engine, AI companion/guardian/mirror), I'll do it in phases and ship something usable at each step.

## Phase 0 — Foundations (single turn)

- Extract v2 design tokens (`tokens/colors.css`, `tokens/typography.css`, `tokens/spacing.css`, `styles.css`) into `src/styles.css` as CSS variables + base layers. Load Sora / Newsreader (italic, opsz 18) / Inter from Google Fonts via `__root.tsx` `<link>`.
- Build the shared kit in `src/components/shutap/`:
  - `Eye` / `EyeDefs` (blinking + breathing eyes mascot from `assets/eye-mascot.svg`)
  - `SiteHeader` (logo, rooms, hall of fame, avatar menu with admin entry conditional on `has_role('admin')`)
  - `CompanionBubble` (draggable, position persisted in `localStorage` key `shutap_bubble`; tap → routes to Landing#ask)
  - `MoodBadge`, `SupportPill`, `ResourceCard` (988 / Samaritans / findahelpline crisis card)
  - `Toast` ("+ just sat down")
- Delete v1 routes/components that v2 replaces.

## Phase 1 — Lovable Cloud + schema + auth

- Enable Lovable Cloud.
- Migration creates the full schema from the README:
  - `app_role` enum + `user_roles` + `has_role()` security-definer fn
  - `aliases` (user_id, emotion, nation, creature, emoji, display_name)
  - `rooms`, `players`, `reactions`, `relates`, `comments`, `comment_felt`, `presence`, `scans`, `story_tags`, `halls`, `outcomes`
  - `subscriptions`, `entitlements`, `payment_events`
  - `mirror_state`, `mirror_patterns`, `mirror_threads`, `mirror_pulls`
  - `share_assets`
  - Per-table GRANTs + RLS policies scoped to `auth.uid()`; reactions/comments require an alias; `is_seed` rooms are public-read.
- Seed migration imports `seed-data.js` → 44 synthetic rooms with `is_seed: true` + computed Hall-of-Fame ranks.
- **Welcome** page (`src/routes/auth.tsx` — public): Google + Apple + email/password sign-in (via `lovable.auth.signInWithOAuth`), 18+ birthday spinner gate (the day options update daily so "today" is always the 18-years-ago boundary), alias slot-machine ceremony (rolls emotion × nationality × creature), `shutap_returnTo` redirect from `sessionStorage`, one-time emotional contract.

## Phase 2 — Landing (the hub)

`src/routes/index.tsx` — hero with entity sentence, **Spill** + **Scan** balanced CTA cards, live featured room, stream preview, HOF preview, notifications surfaced through the companion bubble (no bell), FAQPage + Organization + WebSite + SearchAction JSON-LD.
Overlays: Spill intake (one question at a time; companion server fn drives follow-ups; Privacy-Shield regex pass; Guardian gate routes crisis to resources, never publishes), Scan (9 tap-cards → 0–999 with count-up reveal + signature), companion composer (NL → structured query → real rooms reshape the stream).

## Phase 3 — Stream + Room detail

- `src/routes/stream.tsx` — Xiaohongshu-style waterfall of tiles (gradient cover, creature avatar, mood badge, title, relate/sitting counts). Companion composer reshapes the feed; no category chips / search bar / filter tabs (banned).
- `src/routes/room.$id.tsx` — full-viewport room: presence seats (avatars pop in with toast), 5 verdict-free reactions, "omg same" relate, AI-guided comment thread with starter chips, share trigger T4 on first relate. Per-room `DiscussionForumPosting` JSON-LD injected on open; page title = story title.

## Phase 4 — Hall of Fame, Profile, Admin

- `src/routes/halls.tsx` — 6 halls (Most Loving 🤍 · Bravest 💪 · Most Healing 🌿 · Most Relatable 🫂 · Hardest-Won 🪨 · Funniest 😭) × daily / weekly / all-time, ranked rows with band chips (held / honored / legend), hash-routing to specific hall, rows link to source room.
- `src/routes/_authenticated/profile.tsx` + 6 settings sub-pages (Identity, Account, Notifications, Privacy & safety, Data, Subscription). Standing bars (Support/Kindness, Empathy, Wisdom) computed from reactions/comments. Mirror entry tile.
- `src/routes/_authenticated/_admin/admin.tsx` gated by `has_role('admin')` — moderation queue (Guardian/Privacy-Shield signals), analytics, platform-config.

## Phase 5 — Mirror + share engine + AI

- **Mirror** (`src/routes/_authenticated/mirror.tsx`) — breathing orb, "the shape of you, right now" (free signature reading), covered-mosaic for paid blocks. Mirror engine server fn (Lovable AI Gateway, `google/gemini-3-flash-preview`) generates signature/patterns/arc/instincts/today/pull/threads/markers from the user's own data. Hard-coded reflect-never-advise constraints + crisis routing always-on. Entitlement check via `entitlements.feature='mirror'` server-side (client never decides).
- **Mirror speak channel** (paid) — full-screen therapeutic session with mandatory crisis-detection middleware.
- **Subscription** — Lovable built-in payments (Stripe seamless w/ managed_payments for the digital subscription). Cancel as easy as subscribe.
- **Share engine** (`src/lib/share-engine.ts`) — valence gate + per-session/per-day caps + cool-down. Triggers T1–T12; channel targets (Messages, X, WhatsApp, Instagram, TikTok, native, copy-link) with real brand logos.
- AI server fns: companion (intent parser + framing), guardian (crisis + identifier redaction), mirror engine, mirror-speak, all `createServerFn` calling Lovable AI Gateway with `LOVABLE_API_KEY`.

## Phase 6 — Polish + SEO/GEO/AEO

- `llms.txt` at repo root with the locked entity sentence.
- Per-route `head()` metadata; locked entity sentence verbatim in title/description/Organization/WebSite schema.
- Route-pattern `/is-it-normal/[slug]` (QAPage), `/data/[slug]` (Dataset) stubs gated to "only with unique aggregate data."
- Final pass: motion (breathing, dot-by-dot fills, arc draw), accessibility (focus rings, keyboard nav for the alias ceremony, ARIA for reactions), production teardown of `is_seed` content.

## Technical details

- Stack: TanStack Start v1, React 19, Tailwind v4, Lovable Cloud (Supabase under the hood), Lovable AI Gateway for all AI calls (default model `google/gemini-3-flash-preview`), Lovable built-in Stripe for Mirror subscription.
- Auth gate: managed `_authenticated/route.tsx` (ssr:false). Public routes (Landing, Stream, Room, Halls) render via public server fns w/ publishable client + narrow `TO anon` SELECT policies on `is_seed`/public columns. Protected actions (relate, react, comment, scan, spill) use `requireSupabaseAuth`.
- Realtime: presence via Supabase Realtime channel per room, plus throttled inserts to `presence` table.
- Storage: alias + bubble position + `seen_contract` in `localStorage`; everything else server-truth (entitlement especially).
- Banned-pattern lint: no category chips, no verdict copy, no bell icon, no standalone primary share button, no Mirror in bottom-nav — enforced by code review on each phase.
- Per the handoff, the `.dc.html` files are the visual reference; I'll match copy, colors, type, motion, and spacing.

## Execution

This will span multiple sessions. I'll start Phase 0 + Phase 1 in the next turn (foundations + Cloud + schema + auth + Welcome) and stop after Welcome works end-to-end so you can sanity-check the look before I move to Landing/Stream. Each subsequent phase is one focused turn.
