# Shutap SEO/GEO + Brand Architecture

Locking the brand voice, entity, and discovery foundations now — then building the engine in the order §9 prescribes (entity → corpus + outcomes → 12 hand-built hubs → links/PR → programmatic, gated by §8).

## Phase 1 — Entity + brand foundation (this turn)

The cheapest, highest-leverage work and a prerequisite for everything else. None of it needs the outcome corpus.

1. **Lock the tagline + entity sentence** in every machine-read surface:
   - `__root.tsx` head: title template, `og:site_name`, default description = short entity variant, sitewide `Organization` JSON-LD with the canonical entity sentence as `description`.
   - `/about` route (new) — entity sentence as the answer-first paragraph + brand voice below it.
   - `/methodology` route (new) — YMYL trust: "real people, no AI-written stories," companion-is-not-a-therapist, crisis routing, takedown path.
   - `/trust` route (new) — pseudonymity model, privacy shield, what gets indexed vs. doesn't.
   - `public/llms.txt` pointing at entity sentence, pillars, top hubs, outcome pages, methodology.

2. **Landing (`/`)** copy refresh to spec:
   - H1: `finally, somewhere to *not* shut up.`
   - Subhead, trust microcopy, companion first line per §1.
   - Voice rules enforced (lowercase chrome, sentence-case headlines, slang dialed for evergreen UI).

3. **Crawler policy (§7)** in `public/robots.txt`:
   - Explicit `Allow: /` for `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `CCBot`, `Applebot-Extended`, `Bytespider`, `Amazonbot`.
   - Sitemap directive deferred until a project URL is set.

4. **Sitemap server route** at `src/routes/sitemap[.]xml.ts` listing only the routes that actually exist after this phase: `/`, `/about`, `/methodology`, `/trust`, the 4 pillar hubs (shell-only is OK because they carry unique hand-written framing copy), and the first hand-built situation hubs as they ship in Phase 2.

5. **Selective indexing primitives** — add a small `<RouteIndexability>` helper that emits `<meta name="robots" content="noindex">` per route. Wire it on every route by default to **index** in Phase 1; the hooks exist so Phase 4 thin-rooms can flip to `noindex` without a refactor.

## Phase 2 — Pillar + situation hub scaffolding (next session)

Routes only, with the answer-first paragraph and PAA-shaped FAQ schema; the aggregates section renders an explicit empty state ("we haven't gathered enough confirmed outcomes to publish a number yet") until the §8 gate trips. This is the §8 anti-spam discipline applied from day one — the page exists for navigation/intent capture, but the aggregate claim only appears when real.

- 4 pillar hubs: `/relationships`, `/marriage`, `/family`, `/career` — hand-written framing, links down to situation hubs, links across to the relevant Halls.
- Situation hub template at `/is-it-normal/$slug` with: verbatim-question H1, 40–60 word answer-first paragraph, PAA cluster, `FAQPage` + `Article` JSON-LD, related-rooms slot (empty until corpus), outcome-aggregate slot (gated).
- Hand-author the 20 starter hubs from §11 (5 per pillar). No programmatic generation.

## Phase 3 — Outcome data + pseudonym E-E-A-T (after corpus seeds)

Depends on the Wisdom Graph having real confirmed outcomes. Pure rendering work once data exists.

- `/what-happens/$slug` outcome pages — numbered, dated, attributed claims with `Dataset` JSON-LD.
- `/u/$pseudonym` profile pages with `author` schema: stories shared, outcomes confirmed, "same" count, halls reached.
- `/halls/$hall/$region/$window` collection pages.

## Phase 4 — Programmatic + room indexing (gated by §8)

Only after Phase 3 has real aggregates flowing. Selective `noindex` on thin/duplicate rooms; canonicalize near-duplicates; privacy-shield gate before indexing any room; defamation/takedown route at `/report`.

## Out of scope right now
- Auto-generating any hub before §8's unique-data threshold is met.
- A Wikidata entry submission (handled manually by the user once entity is live).
- The Tagger pipeline that derives PAA variants from situation signatures — needs the corpus first.

---

## Technical notes (Phase 1 only)

- All metadata via TanStack `createFileRoute().head()`; canonical + `og:url` self-referencing on leaves; `og:image` only at leaves once we have one.
- `Organization` JSON-LD in `__root.tsx`; per-page `Article`/`FAQPage`/`Dataset` added at the leaf in later phases.
- Title template: child routes override via their own `title` meta entry; the short entity sentence stays in the home title only.
- No project URL exists yet — use **relative** paths in canonical/og:url throughout; no `Sitemap:` directive in robots.txt; sitemap entries are path-only.
- Voice copy lives in route components; nothing brand-slang goes into `head()` meta.

## What I need from you to start Phase 1
Nothing — I can ship Phase 1 against the spec as-written. Approve the plan and I'll build it in the next turn.