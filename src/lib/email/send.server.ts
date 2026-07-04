// sendEmail: single Resend send wrapper. Resolves identity, renders the
// template, enforces the routing policy (identity ↔ emailClass) and the
// suppression matrix, then posts to Resend. All outbound Resend sends in
// this codebase MUST go through this wrapper.
import { formatFrom, IDENTITIES, type IdentityId } from './identities'
import { renderTemplate } from './render'
import { TEMPLATES, type TemplateId, type TemplateVars } from './templates'

const RESEND_URL = 'https://api.resend.com/emails'

export type SendResult = {
  ok: boolean
  error?: string
  id?: string
  suppressed?: boolean
  reason?: string
}

export type SendOpts = {
  marketingOptOut?: boolean
  threadMuted?: boolean
  crisisFlagged?: boolean
}

export async function sendEmail(
  identityId: IdentityId,
  templateId: TemplateId,
  vars: TemplateVars,
  to: string,
  opts: SendOpts = {},
): Promise<SendResult> {
  const tpl = TEMPLATES[templateId]
  if (!tpl) {
    const error = `unknown template: ${templateId}`
    console.warn(`[sendEmail] rejected — ${error}`)
    return { ok: false, error }
  }

  // Template pins its own identity; if caller passes a different id, prefer
  // caller — lets safety/privacy/legal reuse a template if ever needed.
  const identity = IDENTITIES[identityId] ?? IDENTITIES[tpl.identity]

  // 1. Routing policy: identity must permit this email class.
  if (!identity.allowedClasses.includes(tpl.emailClass)) {
    const reason = `identity ${identity.id} does not allow class ${tpl.emailClass}`
    console.warn(`[sendEmail] rejected template=${templateId} — ${reason}`)
    return { ok: false, error: reason }
  }

  // 2. Suppression matrix. transactional is never suppressed.
  if (tpl.emailClass !== 'transactional') {
    let reason: string | null = null
    if (opts.crisisFlagged && (tpl.emailClass === 'engagement' || tpl.emailClass === 'nontransactional')) {
      reason = 'crisisFlagged'
    } else if (opts.threadMuted && tpl.emailClass === 'engagement') {
      reason = 'threadMuted'
    } else if (opts.marketingOptOut && tpl.emailClass === 'nontransactional') {
      reason = 'marketingOptOut'
    }
    if (reason) {
      console.warn(`[sendEmail] suppressed template=${templateId} reason=${reason}`)
      return { ok: true, suppressed: true, reason }
    }
  }

  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'RESEND_API_KEY missing' }

  const rendered = renderTemplate(templateId, vars)

  try {
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: formatFrom(identity),
        to: [to],
        reply_to: identity.replyTo,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    })
    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      return { ok: false, error: `resend ${r.status}: ${txt.slice(0, 300)}` }
    }
    const body = (await r.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: body.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'fetch failed' }
  }
}
