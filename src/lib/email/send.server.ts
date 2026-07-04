// sendEmail: single Resend send wrapper. Resolves identity, renders the
// template, and posts to Resend. All outbound Resend sends in this
// codebase MUST go through this wrapper.
import { formatFrom, IDENTITIES, type IdentityId } from './identities'
import { renderTemplate } from './render'
import type { TemplateId, TemplateVars } from './templates'

const RESEND_URL = 'https://api.resend.com/emails'

export type SendResult = { ok: boolean; error?: string; id?: string }

export async function sendEmail(
  identityId: IdentityId,
  templateId: TemplateId,
  vars: TemplateVars,
  to: string,
): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'RESEND_API_KEY missing' }

  const rendered = renderTemplate(templateId, vars)

  // Template pins its own identity; if caller passes a different id, prefer
  // caller — lets safety/privacy/legal reuse a template if ever needed.
  const identity = IDENTITIES[identityId] ?? rendered.identity

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
