# Plan: migrate `/api/complete` to Lovable AI Gateway

Move Companion + Mirror off direct Anthropic and onto the Lovable AI Gateway via the AI SDK. Anthropic remains as an opt-in override when `ANTHROPIC_API_KEY` is set, so nothing regresses for anyone who set that secret. The client contract (`POST /api/complete` → `{ text }` or `{ fallback: true }`) stays identical, so `complete()` callers in `Stream.tsx`, `RoomDetail.tsx`, etc. do not change.

## What changes

1. **Add gateway helper** — `src/lib/ai-gateway.server.ts` with `createLovableAiGatewayProvider` (per the `ai-sdk-lovable-gateway` knowledge: OpenAI-compatible adapter, `Lovable-API-Key` header, `X-Lovable-AIG-SDK: vercel-ai-sdk`, run-id capture).
2. **Provision key** — ensure `LOVABLE_API_KEY` exists via `ai_gateway--create` (no user prompt).
3. **Install deps** — `bun add ai @ai-sdk/openai-compatible`.
4. **Rewrite `src/routes/api/complete.ts`**:
   - If `ANTHROPIC_API_KEY` set → keep the existing Anthropic path (override).
   - Else if `LOVABLE_API_KEY` set → use AI SDK `generateText` with `gateway("google/gemini-3-flash-preview")`, passing through `system` + `messages` + `maxTokens` (mapped to `maxOutputTokens`).
   - Else → return `{ fallback: true }` (existing soft-fail behavior, UI keeps working via local fallbacks).
   - Surface `429` / `402` as `{ fallback: true, error }` so callers degrade instead of throwing.
5. **Default model** — `google/gemini-3-flash-preview` (overridable via `LOVABLE_AI_MODEL` env).

## What does NOT change

- `src/lib/ai.ts` (`complete()` signature and contract).
- All callers (Companion in `Stream.tsx`, Mirror in `RoomDetail.tsx`, etc.).
- Brand voice prompts (Option 2) and Mirror room grounding (Option 3) remain TBD — not part of this step.

## Files

- create: `src/lib/ai-gateway.server.ts`
- edit: `src/routes/api/complete.ts`
- edit: `package.json` (via `bun add`)

## Verification

- `tsgo` typecheck.
- Hit `/api/complete` with a small payload and confirm `{ text }` is returned (or `{ fallback: true }` if no key).
