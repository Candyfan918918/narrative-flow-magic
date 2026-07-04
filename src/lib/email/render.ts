// renderTemplate: substitutes vars, wraps body in the shared layout,
// and returns { subject, html, text, identity }.
import { IDENTITIES, type Identity } from './identities'
import { baseLayout, baseText, ctaButton } from './layout'
import { TEMPLATES, type TemplateId, type TemplateVars } from './templates'

export type RenderedEmail = {
  subject: string
  html: string
  text: string
  identity: Identity
}

const DEFAULT_UNSUB = 'https://shutap.com/profile#notifications'

// Replace {{token}} placeholders in an already-rendered string. Used as a
// final pass so template authors can inline {{alias}}, {{situation_hint}},
// {{deep_link}}, {{unsubscribe_url}} literally in copy if they prefer.
function substitute(input: string, vars: Record<string, string>): string {
  return input.replace(/\{\{(\w+)\}\}/g, (_m, key) => (key in vars ? vars[key] : ''))
}

export function renderTemplate(templateId: TemplateId, vars: TemplateVars): RenderedEmail {
  const tpl = TEMPLATES[templateId]
  if (!tpl) throw new Error(`unknown template: ${templateId}`)
  const identity = IDENTITIES[tpl.identity]

  const unsubscribeUrl = vars.unsubscribe_url || DEFAULT_UNSUB
  const deepLink = vars.deep_link || 'https://shutap.com'

  const flat: Record<string, string> = {
    alias: vars.alias ?? '',
    situation_hint: vars.situation_hint ?? '',
    deep_link: deepLink,
    unsubscribe_url: unsubscribeUrl,
  }

  const subject = substitute(tpl.subject(vars), flat)
  const preview = substitute(tpl.preview(vars), flat)

  const bodyHtmlRaw = substitute(tpl.buildBodyHtml(vars), flat)
  const bodyHtml = `${bodyHtmlRaw}
${ctaButton(deepLink, tpl.cta)}`

  const html = baseLayout({ preview, bodyHtml, identity, unsubscribeUrl })
  const text = baseText(substitute(tpl.buildBodyText(vars), flat), identity, unsubscribeUrl)

  return { subject, html, text, identity }
}
