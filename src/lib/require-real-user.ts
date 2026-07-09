// Server middleware: rejects anonymous Supabase sessions. Wraps
// requireSupabaseAuth so any mutation using it is guaranteed a real user
// (Google / Apple / verified email). Anonymous browsing is still allowed
// on GET server fns that keep requireSupabaseAuth only.
import { createMiddleware } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export const requireRealUser = createMiddleware({ type: 'function' })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const claims = context.claims as { is_anonymous?: boolean; email?: string } | undefined
    if (claims?.is_anonymous) {
      throw new Error('sign_in_required: this action needs a real account')
    }
    return next()
  })
