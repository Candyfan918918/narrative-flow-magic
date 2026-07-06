// Email preference/token store. Server-only. Uses supabaseAdmin because
// unsubscribe/preferences routes are opened by public visitors with only a
// token — there's no user session at that point.
//
// Token = random 32-byte base64url, generated lazily on first email send
// via ensureEmailPrefsToken(email). Rotate by nulling the column.

import { randomBytes } from 'node:crypto'

export type EmailPrefs = {
  notif_all_opt_out: boolean
  notif_checkins_opt_out: boolean
  notif_community_opt_out: boolean
  notif_digest_opt_out: boolean
}

export type PrefsRecord = {
  userId: string
  email: string
  token: string
  prefs: EmailPrefs
}

export const DEFAULT_PREFS: EmailPrefs = {
  notif_all_opt_out: false,
  notif_checkins_opt_out: false,
  notif_community_opt_out: false,
  notif_digest_opt_out: false,
}

function mintToken(): string {
  return randomBytes(32).toString('base64url')
}

function pickPrefs(row: Record<string, unknown>): EmailPrefs {
  return {
    notif_all_opt_out: Boolean(row.notif_all_opt_out),
    notif_checkins_opt_out: Boolean(row.notif_checkins_opt_out),
    notif_community_opt_out: Boolean(row.notif_community_opt_out),
    notif_digest_opt_out: Boolean(row.notif_digest_opt_out),
  }
}

/**
 * Look up a profile by email (case-insensitive), generating an
 * email_prefs_token if missing. Returns null when no profile exists (e.g.
 * a test address not tied to a real user).
 */
export async function ensureEmailPrefsToken(email: string): Promise<PrefsRecord | null> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id,email,email_prefs_token,notif_all_opt_out,notif_checkins_opt_out,notif_community_opt_out,notif_digest_opt_out')
    .ilike('email', normalized)
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  let token = (data.email_prefs_token as string | null) ?? null
  if (!token) {
    token = mintToken()
    const { error: updErr } = await supabaseAdmin
      .from('profiles')
      .update({ email_prefs_token: token })
      .eq('user_id', data.user_id as string)
    if (updErr) return null
  }

  return {
    userId: data.user_id as string,
    email: (data.email as string) ?? normalized,
    token,
    prefs: pickPrefs(data as Record<string, unknown>),
  }
}

export async function getPrefsByToken(token: string): Promise<PrefsRecord | null> {
  if (!token) return null
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id,email,email_prefs_token,notif_all_opt_out,notif_checkins_opt_out,notif_community_opt_out,notif_digest_opt_out')
    .eq('email_prefs_token', token)
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return {
    userId: data.user_id as string,
    email: (data.email as string) ?? '',
    token,
    prefs: pickPrefs(data as Record<string, unknown>),
  }
}

export async function updatePrefsByToken(
  token: string,
  patch: Partial<EmailPrefs>,
): Promise<PrefsRecord | null> {
  const rec = await getPrefsByToken(token)
  if (!rec) return null
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const next: EmailPrefs = { ...rec.prefs, ...patch }
  // If the user re-enables any category (sets an opt-out to false), clear the
  // global "all off" flag so per-category prefs actually take effect. Without
  // this, notif_all_opt_out short-circuits every non-transactional send in
  // suppressionFromPrefs() and the toggle appears to do nothing.
  if (
    !next.notif_checkins_opt_out ||
    !next.notif_community_opt_out ||
    !next.notif_digest_opt_out
  ) {
    next.notif_all_opt_out = false
  }
  const { error } = await supabaseAdmin
    .from('profiles')
    .update(next)
    .eq('user_id', rec.userId)
  if (error) return null
  return { ...rec, prefs: next }
}

export async function unsubscribeAllByToken(token: string): Promise<PrefsRecord | null> {
  return updatePrefsByToken(token, {
    notif_all_opt_out: true,
    notif_checkins_opt_out: true,
    notif_community_opt_out: true,
    notif_digest_opt_out: true,
  })
}
