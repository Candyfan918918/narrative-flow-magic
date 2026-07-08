## Scope

UI/UX-only alignment of the legal surface to `Shutap_Legal_standalone.html`. No auth/billing/AI/data changes. One new leaf route added because the template introduces a `disclaimer` doc that isn't in the app today.

## Files touched

1. `src/components/site/DocLayout.tsx` — restyle
2. `src/routes/terms.tsx` — full copy rewrite (16 numbered sections)
3. `src/routes/privacy.tsx` — full copy rewrite (13 numbered sections)
4. `src/routes/guidelines.tsx` — swap to single white-card bulleted list
5. `src/routes/safety.tsx` — three white "hotline card" links + closing paragraph
6. `src/routes/ai-disclosure.tsx` — dark plum gradient card with eye mascot + italic quote + explainer
7. `src/routes/contact.tsx` — 4 mailto "cbox" cards
8. `src/routes/disclaimer.tsx` **(new)** — Medical / Legal Disclaimer (formal + in-voice card)
9. `src/routes/legal.tsx` — add disclaimer to `OTHERS` and `SECTIONS`

Routes, loaders, `head()` metadata, canonical URLs, JSON-LD, and `SITE_URL` usage all stay. Only page bodies, titles rendered by `DocLayout`, and the sidebar/footer chrome change.

## DocLayout changes

- Sidebar `DOC_NAV` becomes the template's 7 items (add `{ href: '/disclaimer', label: 'medical / legal disclaimer' }`).
- Replace `<SiteFooter />` with the template's inline footer: full-width `.5px` top border on `#fdf3f6`, `max-width 980`, all 7 doc links (Inter 12.5px `#6b4a5c`) on the left, italic caption "18+ · pseudonymous · not a medical or legal service" (Newsreader italic 12px `#9e7a8c`) on the right.
- Titles: `DocLayout` `title` prop keeps taking whatever the route passes. Each route now passes Title Case per template ("Terms of Service", "Privacy Policy", "Community Guidelines", "Crisis & Safety", "AI Disclosure", "Contact", "Medical / Legal Disclaimer"). SEO `<title>` in `head()` stays unchanged.
- Sublines updated to template values (e.g. "Effective: July 1, 2026 · Operator: Shutap").
- Sidebar eyebrow, active-pill treatment, header sticky bar, and the 40px gap / 188px sidebar / 680px main widths are already correct — no geometry change.

## Content ports (verbatim from template)

Each route body is replaced with the exact HTML the template's `render(id)` returns, converted to JSX. All copy (numbered section titles, bold spans, links, emoji `🤍`, em-dashes, quotes) matches the template character-for-character. Inline styles (white card `background:#fff;border:.5px solid rgba(11,8,15,.08);border-radius:18px;padding:22px 24px`, gradient card `linear-gradient(160deg,#2e0d1a,#1a0a12)`, cbox rows, etc.) copy verbatim.

Guidelines becomes a single white rounded card with a `<ul>` of 7 bullets + trailing "We remove content and accounts that break these rules." paragraph.

Safety renders three white cards: 988 (`tel:988`), Samaritans (`tel:116123`), findahelpline.com (external), followed by the closing paragraph with 🤍.

AI Disclosure renders the plum gradient card with the inline eye SVG (unique ids `eyeGAI`/`pupGAI`) and italic Newsreader body, followed by the explainer paragraph about California disclosure.

Contact renders 4 mailto cbox cards (hello / privacy / safety / legal) plus the "in an emergency" line linking to `/safety` and the italic footer note.

Disclaimer (new route) renders Formal `<h3>` + paragraph and In-voice `<h3>` + white italic card quote.

## SEO wiring for `/disclaimer`

- `head()` mirrors sibling routes: TITLE `"Medical / Legal Disclaimer — Shutap"`, DESCRIPTION from the formal paragraph (<160 chars), og/twitter tags, canonical `${SITE_URL}/disclaimer`.
- Add `{ heading, body }` entry to `src/routes/legal.tsx` `SECTIONS` and `{ href: "/disclaimer", label: "Medical / legal disclaimer" }` to `OTHERS`.

## Out of scope

Header (`SiteHeader`) — the design's header matches what's already there, no changes. Auth pill, admin-menu logic, hash-based single-page doc-switching (the app uses real routes and that's better than the template's `#id` model — keep routes). Copy on `/legal` hub stays; only add the new disclaimer item.

## Verification

Playwright at 1440×900 and 390×844 on `/terms`, `/privacy`, `/guidelines`, `/safety`, `/ai-disclosure`, `/contact`, `/disclaimer`. Screenshot each; confirm sidebar active state, footer link row + italic caption, gradient AI card, cbox rows, hotline cards. Zero console errors. Report files touched + any deviations.