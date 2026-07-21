## What's actually broken

Confirmed via live preview probe on `/`:

1. **Spill-pill placeholder never rotates.** DOM sample after 3.5s shows placeholder still `"type the thing you can't say out loud…"`. Root cause: the interval mutates `input.placeholder` directly, but the Hero component re-renders constantly (the exchange demo calls `setLxQ` every ~26ms while typing), and React reconciles `placeholder={PLACEHOLDERS[0]}` back to index 0 on every render, wiping the DOM mutation.

2. **"Happening in a room right now" exchange demo.** Probe shows the question and answer text DO cycle (`"i'm the only one…"` → `"my boss takes credit…"`), so the animation loop itself runs. What can still read as "broken":
   - The question bubble types character-by-character but has no caret and no visible cursor, so it can look like snapped text rather than typing.
   - The assistant bubble fades in but the question bubble has no matching entry transition, so the pair feels uneven.

## Fix

**File: `src/pages/home/sections/Hero.tsx` only.**

1. Rotating placeholder — make it React-controlled:
   - Add `const [phIdx, setPhIdx] = useState(0)`.
   - In the existing placeholder `useEffect`, replace the direct `el.placeholder = …` mutation with `setPhIdx(k => (k + 1) % PLACEHOLDERS.length)`. Keep the "pause while focused / typed into" guard by reading `inputRef.current` inside the interval.
   - Change the input to `placeholder={PLACEHOLDERS[phIdx]}` so re-renders can't clobber it.
   - Slow the interval to ~2200ms (1s is jittery next to the typing demo).

2. Exchange demo polish (small, no behavior change):
   - Add a blinking caret span at the end of the question bubble while `lxQ.length < currentQ.length`; hide it once typing completes.
   - Give the question bubble the same `opacity/transform` transition the answer bubble already has, keyed off "typing started", so both bubbles enter with matching motion.

Nothing else changes — no new deps, no other files, no copy edits, no ticker changes.

## Verification

- Reload `/`, wait 6s, sample `input.placeholder` twice ~2.5s apart — values must differ.
- Watch the exchange demo through one full cycle: caret blinks during typing, disappears when answer bubble appears, question bubble fades/slides in on each new pair.