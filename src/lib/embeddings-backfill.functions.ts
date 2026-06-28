// Phase 2c — one-shot backfill of embeddings for existing situations.
// Admin-only. Walks situations with embedding IS NULL in oldest-first batches,
// generates a 1536-d vector via the Lovable AI Gateway, and writes via
// service-role so we can bypass row-level write policies for backfill.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const Input = z.object({ limit: z.number().int().min(1).max(200).default(50) })

export const backfillEmbeddings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<{ scanned: number; embedded: number; remaining: number }> => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Error('forbidden')

    const { embedText, toVectorLiteral } = await import('@/lib/agents/embeddings.server')
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: rows } = await supabaseAdmin
      .from('situations')
      .select('id, clean_text, body, title')
      .is('embedding', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(data.limit)

    let embedded = 0
    for (const r of rows ?? []) {
      const text = [r.title, r.clean_text, r.body].filter(Boolean).join('\n').trim()
      if (!text) continue
      const vec = await embedText(text)
      if (!vec) continue
      const { error } = await supabaseAdmin
        .from('situations')
        .update({ embedding: toVectorLiteral(vec) as unknown as never })
        .eq('id', r.id as string)
      if (!error) embedded++
    }

    const { count } = await supabaseAdmin
      .from('situations')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null)
      .is('deleted_at', null)

    return { scanned: rows?.length ?? 0, embedded, remaining: count ?? 0 }
  })
