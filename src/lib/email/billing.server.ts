// Transactional billing emails triggered by the Stripe webhook (receipt,
// cancellation confirmation). Stripe retries webhook deliveries, so every
// send is recorded insert-first in billing_emails — unique on
// (kind, dedupe_key) — and the email only goes out when the insert succeeds.
// If the send itself fails, the ledger row is removed so a webhook retry can
// try again. Nothing here ever throws: a failed email must never fail the
// webhook response.
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './send.server'
import type { TemplateVars } from './templates'

export type BillingEmailKind = 'mirror_receipt' | 'mirror_cancelled' | 'mirror_trial_ending'

let _admin: any = null
function admin(): any {
  if (!_admin) {
    _admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }
  return _admin
}

/** Lowercased long-form date for email copy, e.g. "july 22, 2026". */
export function formatEmailDate(input: string | number | Date): string {
  const d = input instanceof Date ? input : new Date(input)
  return d
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .toLowerCase()
}

/** Format a Stripe minor-unit amount with its currency symbol, two decimals. */
export function formatStripeAmount(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(amountMinor / 100)
  } catch {
    return `$${(amountMinor / 100).toFixed(2)}`
  }
}

export type BillingEmailOutcome = 'sent' | 'duplicate' | 'failed'

export async function sendBillingEmail(args: {
  kind: BillingEmailKind
  dedupeKey: string
  userId: string
  vars: TemplateVars
}): Promise<BillingEmailOutcome> {
  const { kind, dedupeKey, userId, vars } = args
  try {
    const { error: insertError } = await admin()
      .from('billing_emails')
      .insert({ user_id: userId, kind, dedupe_key: dedupeKey })
    if (insertError) {
      // 23505 = unique violation → already sent for this dedupe key.
      if (insertError.code === '23505') return 'duplicate'
      console.error(`[billing email] ledger insert failed kind=${kind}:`, insertError)
      return 'failed'
    }

    const { data: userRes, error: userError } = await admin().auth.admin.getUserById(userId)
    const email: string | undefined = userRes?.user?.email ?? undefined
    if (userError || !email) {
      console.error(`[billing email] no email for user ${userId} kind=${kind}:`, userError)
      await admin().from('billing_emails').delete().match({ kind, dedupe_key: dedupeKey })
      return 'failed'
    }

    const result = await sendEmail('hello', kind, vars, email)
    if (!result.ok) {
      console.error(`[billing email] send failed kind=${kind}:`, result.error)
      // Release the dedupe slot so a retry (webhook redelivery / next cron
      // run) can re-attempt.
      await admin().from('billing_emails').delete().match({ kind, dedupe_key: dedupeKey })
      return 'failed'
    }
    return 'sent'
  } catch (e) {
    console.error(`[billing email] unexpected failure kind=${kind}:`, e)
    return 'failed'
  }
}
