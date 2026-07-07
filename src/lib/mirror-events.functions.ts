// Client-callable Mirror event recorder for non-server-side events
// (reactions, relates, follows, room dwell). Thin wrapper that re-uses the
// real ingest pipeline so all paths go through the same scrub/embed/match.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireRealUser } from './require-real-user'
import { runIngestMirrorEvent } from '@/lib/mirror-pipeline.functions'

const Input = z.object({
  source: z.enum(['likes', 'follows', 'browse', 'scan']),
  ref_id: z.string().min(1).max(120),
  raw_text: z.string().max(2000).default(''),
  district_hint: z.enum(['self', 'career', 'love', 'family', 'social']).optional(),
})

export const recordMirrorEvent = createServerFn({ method: 'POST' })
  .middleware([requireRealUser])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    await runIngestMirrorEvent({
      supabase: context.supabase,
      userId: context.userId,
      data,
    })
    return { ok: true as const }
  })
