# Strengthen site structure for sitelinks

Google chooses sitelinks algorithmically — they can't be requested. What you can do is make the site's hierarchy unambiguous, so that when Google does pick sub-links it has clean candidates. Right now three signals are weak or missing.

## What's weak today

- **The homepage has no visible navigation.** The global header is deliberately suppressed on `/`, so the only links out of the homepage are in the footer. Google's sitelink candidates come heavily from a site's primary nav.
- **Breadcrumbs cover 4 pages out of ~40.** `BreadcrumbList` markup exists only on `/relationships`, `/marriage`, `/family`, `/career`. The deep content pages that actually earn impressions — `/is-it-normal/*`, `/vent/*`, `/story/*`, hall pages — have none.
- **The existing breadcrumb markup uses relative URLs** (`item: "/"`), which Google may not resolve to your canonical origin.
- **No visible breadcrumb trail anywhere**, so there's no on-page hierarchy to match the markup.

## The plan

**1. Give the homepage a real primary nav**
Add a compact nav row to the homepage header (the immersive hero header component) with the pages you want treated as top-level: rooms, halls, relationships, marriage, family, career, how it works. Styled to match the existing hero chrome, not a second sticky bar.

**2. Add the same core links to the sitewide header**
The global header currently exposes only `rooms` and `halls`. Extend it with the four pillars plus `how it works`, so every non-home page repeats a consistent primary nav — consistency across pages is what Google reads as "this is the site's structure."

**3. Shared breadcrumb helper**
Create one helper that emits `BreadcrumbList` JSON-LD with **absolute** URLs built from the existing `SITE_URL` constant, and a matching small visible trail component (`Home / Family / …`) using the breadcrumb UI primitives already in the project.

**4. Apply breadcrumbs to every deep route**
- `/relationships`, `/marriage`, `/family`, `/career` — replace the hand-written relative markup with the helper
- `/is-it-normal/$slug` — Home / topic hub / question
- `/vent/$topic` — Home / Vent / topic
- `/story/$pillar/$slug` — Home / pillar / story
- `/halls` children — Home / Halls / hall / region
- `/about`, `/how-it-works`, `/faq`, `/lived-intelligence` — Home / page

**5. Tie WebSite and Organization JSON-LD together**
The homepage `WebSite` node and the root `Organization` node are currently unrelated. Link them with a shared `@id` and a `publisher` reference so Google reads one entity rather than two, which also firms up the brand knowledge panel for the "shutap" query that's already your top term.

## Honest expectation

This removes every structural reason sitelinks wouldn't appear, but it can't force them. With 139 brand impressions/month you're below the traffic threshold Google typically requires. Expect sitelinks to follow brand-query growth, not this change alone. The changes are still worth it independently — breadcrumbs render as the URL path line in mobile results, which lifts CTR on the `/is-it-normal/*` pages currently getting impressions and no clicks.

## Technical notes

- New: `src/lib/seo/breadcrumbs.ts` (JSON-LD builder, absolute URLs from `SITE_URL`) and `src/components/seo/Breadcrumbs.tsx` (visible trail).
- Edited: homepage hero header, `src/components/GlobalHeader.tsx`, `src/routes/index.tsx`, and the route files listed in step 4 — additive `scripts` entries in each `head()`, per the existing per-route pattern.
- No changes to robots.txt, sitemaps, canonicals, or any backend logic.
