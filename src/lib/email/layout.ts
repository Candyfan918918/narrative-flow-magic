// Email-safe shared layout. Table-based HTML, inlined CSS, system fonts only.
// Renders a cream card with the shutap text wordmark, body slot, single CTA,
// and a footer with pseudonym-safe unsubscribe link + sender address.

import type { Identity } from './identities'

const CREAM = '#fdfcfb'
const CARD = '#ffffff'
const PINK = '#e0508a'
const TEXT = '#1a0a12'
const MUTED = '#6b5560'
const BORDER = '#f0e6ea'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]!)
}

export function ctaButton(href: string, label: string): string {
  const safeHref = escapeHtml(href)
  const safeLabel = escapeHtml(label)
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px">
    <tr><td align="center" bgcolor="${PINK}" style="border-radius:999px">
      <a href="${safeHref}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${safeLabel}</a>
    </td></tr>
  </table>`
}

export type LayoutArgs = {
  preview: string
  bodyHtml: string
  identity: Identity
  unsubscribeUrl: string
}

export function baseLayout({ preview, bodyHtml, identity, unsubscribeUrl }: LayoutArgs): string {
  const safePreview = escapeHtml(preview)
  const safeUnsub = escapeHtml(unsubscribeUrl)
  const safeAddr = escapeHtml(identity.fromAddress)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>shutap</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:${FONT};color:${TEXT}">
<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">${safePreview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM};padding:32px 12px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
      <tr><td align="center" style="padding:0 8px 20px">
        <span style="font-family:${FONT};font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${TEXT}">shut</span><span style="font-family:${FONT};font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${PINK}">ap</span>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:32px 28px">
        <div style="font-family:${FONT};font-size:16px;line-height:1.6;color:${TEXT}">
${bodyHtml}
        </div>
      </td></tr>
      <tr><td align="center" style="padding:20px 12px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED}">
        sent from ${safeAddr}<br />
        <a href="${safeUnsub}" style="color:${MUTED};text-decoration:underline">unsubscribe or manage preferences</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

export function baseText(bodyText: string, identity: Identity, unsubscribeUrl: string): string {
  return `${bodyText.trim()}

—
shutap · sent from ${identity.fromAddress}
unsubscribe or manage preferences: ${unsubscribeUrl}
`
}
