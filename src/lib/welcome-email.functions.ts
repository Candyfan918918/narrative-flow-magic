// Sends the welcome email to a freshly-minted user. Idempotent: uses
// aliases.welcome_email_sent_at as the guard so re-invocations no-op.
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export const sendWelcomeEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { sendResendEmail, welcomeEmailHtml } = await import('./resend.server')

    // Guard: don't resend
    const { data: alias } = await supabaseAdmin
      .from('aliases')
      .select('display_name, welcome_email_sent_at')
      .eq('user_id', context.userId)
      .maybeSingle()
    if (!alias) return { ok: false, skipped: 'no_alias' as const }
    if (alias.welcome_email_sent_at) return { ok: true, skipped: 'already_sent' as const }

    // Get email from auth user
    const { data: userRes, error: uErr } = await supabaseAdmin.auth.admin.getUserById(context.userId)
    if (uErr || !userRes?.user?.email) return { ok: false, skipped: 'no_email' as const }
    const email = userRes.user.email
    if (userRes.user.is_anonymous) return { ok: false, skipped: 'anonymous' as const }

    const res = await sendResendEmail({
      to: email,
      subject: "you're in.",
      html: welcomeEmailHtml(alias.display_name),
    })
    if (!res.ok) return { ok: false, error: res.error }

    await supabaseAdmin
      .from('aliases')
      .update({ welcome_email_sent_at: new Date().toISOString() } as never)
      .eq('user_id', context.userId)
    return { ok: true }
  })
