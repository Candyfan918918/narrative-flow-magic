# Plan — immersive homepage + /vent/:topic SEO pages

## Scope clarification needed (blocking)

The spec says both:
1. "Replace the current `/` with this page."
2. "The old landing (spill/scan flows) stays at its existing route… behaves exactly as before."

The current `/` **is** the landing page that owns the spill/scan modals — there is no other route hosting them. Two viable readings:

- **(A) Keep spill/scan as modals on the NEW home too.** The new immersive homepage imports `SpillModal` + `ScanModal` and its "spill it →" / "scan it →" buttons open them exactly like today. The old `LandingNativePage` file is removed (its only job was hosting those modals + FAQ). Nothing else in the app changes. This matches the spec's spirit (flows unchanged) and is the smallest, safest change.
- **(B) Move the old landing to a new route** (e.g. `/vent-classic`) and have the new home's CTAs navigate there. This preserves the exact old page byte-for-byte but adds a route users can hit that mirrors home. Uglier, and no flow benefit vs. (A).

**Assumption unless you say otherwise: (A).** Please confirm or override.

## Files I will change

### New home at `/`
- `src/pages/home/HomePage.tsx` — new immersive page (header, hero with mascot, chapters 01/02/03, rooms strip, FAQ, finale, footer). Uses existing `SpillModal`/`ScanModal` and existing companion FAB.
- `src/pages/home/hero/Mascot.tsx` — cursor-tracking / breathing / blinking mascot wrapping the existing `EyeMark`.
- `src/pages/home/chapters/Chapter01Interview.tsx` — scripted chat demo, labeled `the interview · sample`.
- `src/pages/home/chapters/Chapter02Scan.tsx` — 4-phase scan demo, labeled `the scan · sample`.
- `src/pages/home/chapters/Chapter03Mirror.tsx` — 3-card mirror cycle, labeled `THE MIRROR · DEMO`, zero links inside, gold lock banner.
- `src/pages/home/RoomsStrip.tsx` — pulls first 8 real public rooms from existing rooms query, doubles for wrap, auto-drift + drag.
- `src/pages/home/HomeFAQ.tsx` — 4 native-details accordions with the exact copy already in the current landing FAQ + FAQPage JSON-LD.
- `src/pages/home/home.css` — scroll-snap, signature/secondary eases, keyframes (blink/breathe/pulse), reduced-motion overrides, header blur.
- `src/pages/home/mirrorCast.ts` — the 3 demo pattern rows (Impostor / Avoidant Texter / Heart on Read) as static local data, derived from the Agent 12 cast constants; no free-typed numbers.
- `src/routes/index.tsx` — swap component to `HomePage`; keep existing `head()` meta and JSON-LD, add FAQPage JSON-LD from the FAQ module.

### /vent/:topic
- `src/lib/seo/venting-topics.ts` — topic list (family, work, romance, friendship, parenting, money, roommates, stranger), per-topic H1 + italic intro + topic-specific FAQ question. No fake stats.
- `src/routes/vent.$topic.tsx` — SSR route. Loader hits existing rooms table (public + not deleted) filtered by category via `context.queryClient.ensureQueryData`. `head()` emits QAPage + FAQPage + Dataset JSON-LD + canonical + og. Renders breadcrumb, kicker, H1, intro, live line, up to 8 Q&A cards (title, snippet, top-comment pull-quote if present, real counts, "sit in this room →"), topic chip row with real counts, 5 FAQ cards, dark CTA, footer.
- `src/routes/sitemaps/core[.]xml.ts` — add `/vent/{topic}` entries for every topic (currently no venting-topic URLs there).

### Home link retarget
- `rg` for `to="/"` in components/nav — leave alone, they already point to `/`. No other retarget needed.

## What I will NOT touch

Spill flow, scan flow, mirror logic, auth, rooms/comments/reactions/presence, agents, gateway, RLS, migrations, edge functions, companion sheet behavior, existing legal routes, sitemap index, robots.txt.

## Data reads (read-only, no schema changes)

- Rooms strip + topic pages read from the same `situations` / rooms source the existing `Stream` page already uses. I'll reuse the existing query hook / server fn — no new endpoints. If the existing hook can't filter by category, I'll add a thin client-side filter over its results.
- Live "N rooms open now" count reuses the same rooms query length; polls at the query's existing stale time (no new realtime channel).

## Motion / a11y

- Signature ease `cubic-bezier(.34,1.56,.64,1)`, secondary `cubic-bezier(.16,1,.3,1)`.
- All demo timelines gated on IntersectionObserver (threshold .15); off-screen = paused.
- `@media (prefers-reduced-motion: reduce)` disables mascot spring, breathing, chapter demo loops, rooms strip auto-drift, and hero word stagger.

## Verify before finishing

1. `tsgo` typecheck clean.
2. Grep confirms no hardcoded room titles/counts outside the 3 labeled demos.
3. Playwright: load `/`, scroll through all chapters, confirm each demo card renders + no console errors; load `/vent/family`, confirm QAPage JSON-LD present in HTML and room cards render from DB.
4. Spill + scan modals still open from the new home CTAs.
5. Companion FAB unchanged behaviorally.

Confirm assumption (A) and I'll execute.
