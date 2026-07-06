The companion bubble currently only lives on the landing page. You want it present and functional on every page, and you want the eye visually centered inside the circle (it's currently sitting too far right).

Plan:

1. Make the bubble global
   - Add `<CompanionBubble />` to `src/routes/__root.tsx` inside `RootComponent`, after `<Outlet />` so it floats above every route.
   - Remove the existing `<CompanionBubble onOpen={() => setComposerOpen(true)} />` from `src/pages/landing/LandingPage.tsx` to avoid a duplicate on the home page.

2. Wire a single onOpen behavior
   - Tapping the bubble anywhere navigates to `/#ask` so the home page's existing intent-hash handler opens the companion composer (works whether you're already on `/` or on another route).

3. Visually center the eye
   - In `src/components/CompanionBubble.tsx`, nudge the inner EyeMark wrapper left by ~2px (e.g. `transform: 'translateX(-2px)'`) because the brand mark's visual weight sits slightly right of the SVG's geometric center, which is what you observed as "too far right" in the 58px circle.

4. Verify
   - Typecheck with `bunx tsgo --noEmit`.
   - Spot-check in the preview that the bubble appears on `/mirror` and other routes, that only one bubble renders on `/`, and that the eye looks centered in the circle.