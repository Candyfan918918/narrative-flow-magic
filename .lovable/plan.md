
## Scope
Same class of bug as the Spill `</br>` fix, now on Scan. The model wrote `</br>` into `prompt` and `<h2>{current.prompt}</h2>` printed it literally. Fix: extract the Spill sanitizer to a shared util, sanitize every string field in Scan model output at the boundary, and tell the Scan model to stop emitting markup.

## Files changed

1. `src/lib/sanitize.ts` — **new**
2. `src/pages/landing/modals/SpillModal.tsx` — replace local sanitizer with import
3. `src/pages/landing/modals/ScanModal.tsx` — sanitize model output + prompt updates

No other files touched. No Scan card types, JSON schema, scoring bands, fallback deck, dig-deeper prompt language, or free-text guard change.

## Details

### 1. `src/lib/sanitize.ts` (new)
Move `stripHTML` and `stripHTMLInline` verbatim out of `SpillModal.tsx`. Both exported. Behavior identical:
- `stripHTML`: normalizes every `<br>` variant + escaped forms to `\n`, `<p>`/`</p>` → `\n`, strips remaining HTML/escaped tags, decodes `&nbsp; &lt; &gt; &quot; &#39; &amp;` (`&amp;` last), collapses 3+ newlines → 2, trims.
- `stripHTMLInline`: `stripHTML` then flattens newlines to single spaces and collapses double spaces.

### 2. `src/pages/landing/modals/SpillModal.tsx`
- Delete the local `stripHTML` and `stripHTMLInline` definitions.
- Add `import { stripHTML, stripHTMLInline } from '@/lib/sanitize'`.
- No call sites change.

### 3. `src/pages/landing/modals/ScanModal.tsx`

**Imports:** add `import { stripHTML, stripHTMLInline } from '@/lib/sanitize'`.

**Sanitize in `callScanAI()` before returning** (right after `JSON.parse`, ~line 107). Add a small local `sanitizeTurn(t: ScanTurn): ScanTurn` helper that:
- If `t.done === true`:
  - `signature` → `stripHTMLInline`
  - `read` → `stripHTML`
  - `factors[]` → each element `stripHTMLInline` (filter empties)
- Else (card turn):
  - `line` → `stripHTML`
  - `prompt` → `stripHTMLInline`
  - If `card` present, clone with per-type field cleaning:
    - `placeholder`, `left`, `right`, `min_label`, `max_label` → `stripHTMLInline`
    - `options?[]` → map `stripHTMLInline` (filter empties)
    - `items?[]` → map `stripHTMLInline` (filter empties)

Return `sanitizeTurn(parsed)`. This guarantees nothing model-generated reaches `setCurrent` / `setResult` / `saveSituation` / `ScanShareCard` with markup, covering the reported `prompt` case and every sibling.

**Prompt updates — one appended line each, no other prompt language touched:**
- `SCAN_SYSTEM` (line 29): append (after existing content, inside the same string): ` OUTPUT FORMAT: return PLAIN TEXT only in every string field — no HTML tags, no markdown, no <br>; never use </br>; use real newline characters if a break is needed.`
- `sys` in `callScanAI()` (line 88): append the same sentence just before the final `"\noutput ONLY the JSON."` clause.

Leaves untouched: card type unions, JSON schemas, `finishHint`, free-text guard block, score bands, fallback deck, `scrubPII`, dig-deeper prompt in any other file.

## Verification
- Grep for `stripHTML` in the two modal files → SpillModal imports only, ScanModal uses `sanitizeTurn` at the parse boundary.
- Manual: a mock model reply of `{"prompt":"hi</br>there","card":{"type":"text","placeholder":"say it<br/>"}}` should produce `prompt: "hi there"`, `placeholder: "say it"`.
- `bunx tsgo --noEmit` passes.
