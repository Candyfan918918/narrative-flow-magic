// Server-only Resend email sender for transactional emails from hello@shutap.com.
const RESEND_URL = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'shutap <hello@shutap.com>'

export type SendResendArgs = {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendResendEmail({ to, subject, html, from }: SendResendArgs): Promise<{ ok: boolean; error?: string }> {
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
        from: from ?? process.env.RESEND_FROM ?? DEFAULT_FROM,
        to: [to],
        subject,
        html,
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

export function welcomeEmailHtml(displayName?: string | null): string {
  const greeting = displayName ? `hi ${escapeHtml(displayName)},` : 'hi,'
  return `<div style="font-family:'Newsreader',Georgia,serif;font-size:16px;line-height:1.7;color:#1a0a12;max-width:520px;margin:0 auto;padding:28px 24px">
    <p style="margin:0 0 16px;font-style:italic">${greeting}</p>
    <p style="margin:0 0 16px">you're in. this is your space to say the thing you can't say anywhere else — the one that's been sitting in your chest, the one you keep swallowing at dinner. no advice, no fixing, no one from your real life watching. just spill it, and see what actually happened next for people who've lived your exact thing.</p>
    <p style="margin:20px 0 0">— shutap</p>
    <p style="margin:28px 0 0;font-size:12px;color:#9e7a8c;font-family:'Inter',sans-serif">sit with it. no fixing.</p>
  </div>`
}

export function reengagementEmailHtml(displayName?: string | null): string {
  const greeting = displayName ? `hi ${escapeHtml(displayName)}, ` : ''
  return `<div style="font-family:'Newsreader',Georgia,serif;font-size:16px;line-height:1.7;color:#1a0a12;max-width:520px;margin:0 auto;padding:28px 24px">
    <p style="margin:0 0 16px;font-style:italic">${greeting}still here when you're ready — your space is waiting, no pressure.</p>
    <p style="margin:24px 0 0"><a href="https://shutap.com" style="color:#c1216b;text-decoration:none;font-weight:600">open shutap →</a></p>
    <p style="margin:28px 0 0;font-size:12px;color:#9e7a8c;font-family:'Inter',sans-serif">— shutap</p>
  </div>`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
