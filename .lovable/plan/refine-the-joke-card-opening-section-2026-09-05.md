# Refine the joke-card opening section

Match the attached reference exactly for the top of the page (the part above the cards). Only the look and the wording change — the flow, the card generation, the limits and everything behind them stay exactly as they are.

## What changes

**Eyebrow line**
- Becomes `pseudonymous · no advice · different perspectives` with the small dot in front, wide letter-spacing, uppercase, as in the reference.

**Title lockup**
- `shutap.` stays on its own line, with the small eye-circle mark sitting over the end of the word as in the reference.
- `joke about it.` sits underneath, larger and in the wine italic serif, slightly tighter to the line above.

**Sub-line**
- Becomes: `life's a bitch. so make fun of it — you've still got the better sense of humour.` — centred, italic serif, wrapping onto two lines at desktop width.

**The text box**
- Taller, wider (matches the reference's proportions), softer hairline border and rounder corners.
- Placeholder becomes `yeah — tell me about it.`
- The button moves inside the box, bottom-right, and reads `turn it into a joke →`.
- The live typing hint moves out of the box (see the footnote row below), so the box stays clean.

**Footnote row (new)**
- Under the box, centred, small: `no account · names scrubbed · how it works`.
- `how it works` is a hover-expand link: hovering (or tapping on touch, or focusing with a keyboard) slides open a small panel directly beneath it that explains the joke cards in three short lines:
  1. type what happened — names get scrubbed before anything saves.
  2. we read the situation and deal you three angles, face down.
  3. flip one. it roasts the situation, not you.
  The panel closes when the pointer leaves or focus moves away. It is plain text, no link out, no modal.

## What does not change

- Submitting, the crisis path, the three cards, flipping, tier limits, sign-in sheet, sharing, downloads, room posting, the paywall block, the chapters below, and everything server-side.
- `/spill` and `/scan` untouched.
- The page title, description and social preview text are unchanged.

## Technical notes

- All edits are confined to the hero/entry block at the top of `src/pages/home/joke/JokeSurface.tsx` (the `#joke` section) plus the small hover-panel markup and a few keyframes/rules in `src/pages/home/home.css`.
- The hover panel is local component state (`open` boolean) driven by `onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur`/`onClick`, with a max-height + opacity transition; no new dependency.
- Typing hint text keeps its existing logic, just relocated; the archetype readout (`✦ reading this as …` + `not right?`) keeps its current position and behaviour, rendered below the footnote row.
- Colours and type continue to come from the existing tokens (Sora for UI, Newsreader for prose, existing pink/wine ladder); no new hardcoded palette.
