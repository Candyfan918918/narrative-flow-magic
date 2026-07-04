// Low-level Resend HTTP wrapper. Retained for the re-engagement email which
// isn't in the TemplateId registry. Callers MUST pass an identity-formatted
// `from` string (see src/lib/email/identities.ts → formatFrom). No hardcoded
// default from — pass one explicitly.
const RESEND_URL = 'https://api.resend.com/emails'

export type SendResendArgs = {
  to: string
  subject: string
  html: string
  from: string // "Name <addr>" — build with formatFrom(IDENTITIES.x)
  replyTo?: string
  text?: string
}

export async function sendResendEmail({ to, subject, html, from, replyTo, text }: SendResendArgs): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'RESEND_API_KEY missing' }
  try {
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyTo,
        subject,
        html,
        text,
      }),
    })
    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      return { ok: false, error: `resend ${r.status}: ${txt.slice(0, 300)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'fetch failed' }
  }
}
