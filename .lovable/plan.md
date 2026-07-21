## 1. Favicon geometry (square)

- **`public/favicon.svg`** — rewrite viewBox as `0 0 96 96`. Two eyes side by side filling the square with minimal padding, same pink→magenta radial gradient + dark pupil radial, same blink `animateTransform` (scaleY pulse). Highlights preserved.
- **Regenerate square PNGs** into `public/`:
  - `favicon-48.png` (new)
  - `favicon-96.png` (new)
  - `favicon-512.png` (overwrite existing, now square)
  - `apple-touch-icon.png` (overwrite existing 180×180, now square from new SVG)
  - Delete `public/favicon-32.png` (superseded; not in new links array).
- **`src/routes/__root.tsx`** — replace `links` icon entries with:
  ```tsx
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48.png" },
  { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96.png" },
  { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon-512.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  ```

## 2. Copy correction — "group chat, not your therapist"

Full replacement string (lowercase, same sentence position):
> `shutap is a supportive community, not your therapist — not a medical or legal service. in an emergency, call or text 988 (US).`

Files with the exact disclaimer phrase to update:

1. `src/routes/disclaimer.tsx` (line 59) — swap the phrase; keep JSX/quotes intact.
2. `src/pages/home/HomePage.tsx` (line 59) — homepage disclaimer.
3. `src/pages/home/sections/Finale.tsx` (line 47).
4. `src/pages/landing/LandingPage.tsx` (line 461).

Other "group chat" hits are **not** framing Shutap (they describe users' actual group chats: family copy, seed stories, Mirror pattern name, brand blurbs) and are left untouched per your "do not touch anything else" scope.

One judgment call to flag: `src/lib/agents/constitution.ts:4` says `You are the user's group chat, …` inside the AI system prompt — this IS framing Shutap as a group chat, but it's not user-visible copy and is a behavioral instruction to the model, not a claim shown to users or crawlers. **Default: leave it.** Tell me if you want it rewritten too.

## 3. `data-nosnippet` for snippet control

- **`src/pages/home/HomePage.tsx`** — add `data-nosnippet` to the element wrapping the disclaimer line at line 59 (the same one updated in item 2). Text stays visible; only the attribute is added.
- **`src/components/seo/ContentPage.tsx`** — add an optional `nosnippetCapsule?: boolean` prop. When true, render the capsule `<p>` with `data-nosnippet`. Default false — no behavior change for existing consumers.
- **`src/routes/faq.tsx`** — pass `nosnippetCapsule` to `<ContentPage>`.
- `/safety` and all other `ContentPage` routes untouched.

## Files changed (summary)

- `public/favicon.svg` (rewrite)
- `public/favicon-48.png` (new), `public/favicon-96.png` (new), `public/favicon-512.png` (regen), `public/apple-touch-icon.png` (regen), `public/favicon-32.png` (delete)
- `src/routes/__root.tsx` (links array only)
- `src/routes/disclaimer.tsx`, `src/pages/home/HomePage.tsx`, `src/pages/home/sections/Finale.tsx`, `src/pages/landing/LandingPage.tsx` (disclaimer phrase)
- `src/components/seo/ContentPage.tsx` (add prop + attribute)
- `src/routes/faq.tsx` (pass prop)

No meta descriptions, titles, JSON-LD, or other copy touched.
