## Goal
Rebuild the two homepage demo cards (Chapter 01 Spill, Chapter 02 Scan) so they visually mirror the real Spill and Scan flows. Presentation-only: no data model, agent, or CTA changes. Text columns, headings, buttons, and surrounding sections stay exactly as they are.

## Files
- `src/pages/home/sections/Chapter01Spill.tsx` — replace the demo card only.
- `src/pages/home/sections/Chapter02Scan.tsx` — replace the demo card only.

Everything else on `/` (Hero, Chapter03, Rooms strip, FAQ, Finale, header, companion) is untouched.

## Chapter 01 — Spill card
- Dark gradient shell `linear-gradient(160deg,#1c1024,#100b1c)`, radius 28, width `min(384px,100%)`, existing hover tilt kept.
- Top chrome: 9 progress dots (3px, gap 4, fill `#e7548a`) + right label `the spill · sample` (Newsreader italic).
- Stage height 584px, two absolutely-stacked phases, `opacity` crossfade 0.1s.
- **Phase A (interview):** eyes + `SPILL` kicker, reaction line, one big Newsreader-italic question, input pill with typed answer + `send →`. Never a two-sided chat.
- **Phase B (preview):** `preview · in your words` label, explainer, story card (alias `🦉 Quiet Indonesian Owl · family`, title, body, three tag chips `#family #siblings #guilt`), privacy line, edit-instruction input, 2-col destination grid (`keep as journal` / `post to a room →`).
- **Timeline (5×):**
  - Turn 1: dots→2, reaction `a month of carrying that alone — god.`, question `what did it feel like the second she said it?`; after 190ms type `like the floor moved. i just went quiet.` at 5ms/char; hold `180 + chars·5 + 200`ms.
  - Turn 2: dots→4, reaction `and you still haven't said it out loud.`, question `who in your life could you even tell?`; type `no one who knows us. that's the whole problem.`.
  - Dots→8, crossfade to Phase B, hold, loop ~920ms after preview appears.
- IntersectionObserver (threshold 0.15) pauses off-screen; `prefers-reduced-motion` shows Phase B static.

## Chapter 02 — Scan card
- Indigo accent `#7F77DD`, Sora 800 prompts. Shell `linear-gradient(170deg,#1a1226,#100b1c 72%)`, border `rgba(127,119,221,.28)`, radius 26, width `min(420px,100%)`, indigo glow.
- Header: `SCAN` (Sora 800, .3em) + progress bar (6px, track `rgba(255,255,255,.10)`, fill `linear-gradient(90deg,#5B8A5E,#7F77DD)`, 0.16s transition) + `sample` label.
- Stage height 678px, four crossfading phases.
- **Phase 1 choice:** eyes + reaction `ok — so it's her, and it's been sitting a while.`, prompt `where do you feel it first?`, three indigo option rows (`my chest goes tight` / `my head starts spinning` / `i go completely numb`).
- **Phase 2 spectrum:** reaction `yeah. that tracks.`, prompt `how loud is it right now?`, gradient track with 30px white thumb (indigo border, 0.28s ease), end labels `a low hum` / `deafening`.
- **Phase 3 scanning:** mascot inside indigo scan-beam frame, `reading that` + three pulsing dots.
- **Phase 4 result:** counting score 0→740 over 300ms (band color `#e7548a`), `INTENSITY` label, chip row (`relationships` pink + indigo factor chips `still looping`, `not said out loud`), signature card (`Carrying It Loud` + italic sub), read line, mirror nudge card (`see your mirror →`), full-width pink `share your score` button, keep-private / post-to-a-room grid, footer caps `SHUTAP · THE SCAN`.
- Band-color function: `<200 #9e8f9c · <400 #7F77DD · <600 #c87c4a · <800 #e7548a · else #c1216b`.
- **Timeline (5×):** reset (bar 24%, score 0, thumb 50%); 280ms first option selects; 580ms bar→46% + Phase 2; 760ms thumb→80%; 1140ms bar→72% + Phase 3; 1540ms bar→100% + Phase 4 + score count-up; loop at 2680ms.
- IntersectionObserver pause; `prefers-reduced-motion` shows Phase 4 static (score 740).

## Guardrails
- No AI/DB calls in either card; both marked `sample`.
- Keep `EyeGradients` / existing eye mascot component — no redraw.
- No copy changes outside the two cards; wording "pseudonymous" only.
- Verify with `tsgo --noEmit`.