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

// Re-engagement email body. Kept here (not in TemplateId registry) because
// it isn't part of the check-in cadence spec. Uses the shared email-safe
// layout for visual consistency.
export function reengagementEmailHtml(displayName?: string | null): string {
  // Lazy import to keep this file dependency-light at module scope.
  // Layout helpers are pure functions with no side effects.
  const { baseLayout, escapeHtml } = require('./email/layout') as typeof import('./email/layout')
  const { IDENTITIES } = require('./email/identities') as typeof import('./email/identities')
  const { ctaButton } = require('./email/layout') as typeof import('./email/layout')
  const greeting = displayName ? `hey ${escapeHtml(displayName.toLowerCase())},` : 'hey,'
  const body = `<p style="margin:0 0 8px">${greeting}</p>
<p style="margin:0 0 8px">still here when you're ready — your space is waiting, no pressure.</p>
${ctaButton('https://shutap.com', 'open shutap')}`
  return baseLayout({
    preview: "still here when you're ready.",
    bodyHtml: body,
    identity: IDENTITIES.hello,
    unsubscribeUrl: 'https://shutap.com/profile#notifications',
  })
}
