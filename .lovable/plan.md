
## Scope
Runtime fix for the literal `</br>` appearing in composed posts. The tag is emitted by the Spill compose/edit model into the JSON `body` and rendered as plain text by the `pre-wrap` contentEditable preview. Fix = sanitize model output at every entry boundary + tell the model to stop producing markup.

## Files changed
Only one:
- `src/pages/landing/modals/SpillModal.tsx`

No other files touched. Prompts elsewhere, scrubPII, JSON schema, 80/20 rule, and contentEditable read paths are left alone.

## Changes in `src/pages/landing/modals/SpillModal.tsx`

### 1. Add sanitizer helpers (near `scrubPII`, ~line 161)
Two small pure functions, no deps:

- `stripHTML(text: string): string`
  - Normalize every `<br>` variant → `\n`: matches `<br>`, `<br/>`, `<br />`, `</br>`, uppercase, arbitrary whitespace inside the tag, and the escaped forms `&lt;br&gt;` / `&lt;/br&gt;` / `&lt;br/&gt;` / `&lt;br /&gt;` (case-insensitive).
  - Convert `<p>` and `</p>` (and escaped equivalents) → `\n`.
  - Strip all remaining HTML tags (`/<\/?[a-z][^>]*>/gi`) and escaped tag forms (`/&lt;\/?[a-z][^&]*&gt;/gi`).
  - Decode entities: `&amp; &lt; &gt; &quot; &#39; &nbsp;` (nbsp → regular space). Run `&amp;` last so we don't double-decode.
  - Collapse runs of 3+ `\n` down to 2; trim.
- `stripHTMLInline(text: string): string`
  - Calls `stripHTML` then flattens any remaining `\n`/`\r` runs to a single space; collapses multi-space; trims.

### 2. Apply at every model-output boundary
Compose order is always `scrubPII(stripHTML(...))` (sanitize first, then PII scrub):

- `runCompose()` (~lines 407–408): wrap `j.title` with `stripHTMLInline`, `j.body` with `stripHTML`, both then passed through `scrubPII`.
- `runCompose()` catch/fallback branch (~lines 415–421): sanitize `first?.text` title with `stripHTMLInline` and `convo` body with `stripHTML` before slicing/assigning. (Defensive — user text usually clean, but this is a model-output-adjacent boundary too.)
- `runAIEdit()` (~lines 453–454): same treatment — `stripHTMLInline` for `j.title`, `stripHTML` for `j.body`, composed with `scrubPII`.

Leave untouched (already plain text via `innerText`):
- `syncPreviewDOM()` (~lines 432–433)
- `publishOrSave()` live reads (~lines 470–471)

### 3. Prompt updates
Add one explicit line to each prompt string. No other prompt language changes.

- `runCompose` prompt (~line 395): append a sentence stating the output must be PLAIN TEXT only — no HTML tags, no markdown, no `<br>`; use real newline characters (`\n\n`) between paragraphs.
- `runAIEdit` prompt (~line 444): same sentence appended.

The 80/20 rule, JSON schema, scrubPII behavior, and every other prompt clause remain byte-identical.

## Verification
- Grep the file for `stripHTML` call sites → expect exactly the 6 wraps above (2 in runCompose main, 2 in runCompose fallback, 2 in runAIEdit).
- Manually run through a mock body containing `line one</br>line two<br/>line three<p>x</p>&nbsp;&amp;` and confirm output is `line one\nline two\nline three\nx &`.
- Type-check.
