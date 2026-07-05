// Server-fn wrappers for email preferences pages. Route files import from
// here; the .server helper is loaded dynamically inside handlers so it never
// enters client bundles.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const tokenSchema = z.object({ token: z.string().min(10).max(200) })

const patchSchema = z.object({
  token: z.string().min(10).max(200),
  notif_checkins_opt_out: z.boolean().optional(),
  notif_community_opt_out: z.boolean().optional(),
  notif_digest_opt_out: z.boolean().optional(),
})

export type PrefsDto = {
  ok: boolean
  prefs?: {
    notif_all_opt_out: boolean
    notif_checkins_opt_out: boolean
    notif_community_opt_out: boolean
    notif_digest_opt_out: boolean
  }
  email?: string
}

export const loadPrefs = createServerFn({ method: 'POST' })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }): Promise<PrefsDto> => {
    const { getPrefsByToken } = await import('./prefs.server')
    const rec = await getPrefsByToken(data.token)
    if (!rec) return { ok: false }
    // Mask the email in the response — show first char + domain only.
    const [local, domain] = rec.email.split('@')
    const masked = local && domain ? `${local[0]}•••@${domain}` : rec.email
    return { ok: true, prefs: rec.prefs, email: masked }
  })

export const savePrefs = createServerFn({ method: 'POST' })
  .inputValidator((d) => patchSchema.parse(d))
  .handler(async ({ data }): Promise<PrefsDto> => {
    const { updatePrefsByToken } = await import('./prefs.server')
    const { token, ...patch } = data
    const rec = await updatePrefsByToken(token, patch)
    if (!rec) return { ok: false }
    const [local, domain] = rec.email.split('@')
    const masked = local && domain ? `${local[0]}•••@${domain}` : rec.email
    return { ok: true, prefs: rec.prefs, email: masked }
  })

export const processUnsubscribe = createServerFn({ method: 'POST' })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }): Promise<PrefsDto> => {
    const { unsubscribeAllByToken } = await import('./prefs.server')
    const rec = await unsubscribeAllByToken(data.token)
    if (!rec) return { ok: false }
    const [local, domain] = rec.email.split('@')
    const masked = local && domain ? `${local[0]}•••@${domain}` : rec.email
    return { ok: true, prefs: rec.prefs, email: masked }
  })
