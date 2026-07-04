// Template registry. Each template pins its sender identity, subject,
// and html/text builders. Copy is lowercase texty (Companion persona);
// each check-in is one warm line + a single pink CTA deep-linking to
// the eye check-in card. No marketing chrome, no multi-button layouts.

import type { EmailClass, IdentityId } from './identities'
import { baseLayout, baseText, ctaButton, escapeHtml } from './layout'

export type TemplateId =
  | 'welcome'
  | 'checkin_day1'
  | 'checkin_day2'
  | 'checkin_day3'
  | 'checkin_day7'
  | 'checkin_day14'
  | 'checkin_day30'
  | 'reengagement'

export type TemplateVars = {
  alias?: string
  situation_hint?: string
  deep_link?: string
  unsubscribe_url?: string
}

export type TemplateEntry = {
  id: TemplateId
  identity: IdentityId
  emailClass: EmailClass
  subject: (v: TemplateVars) => string
  preview: (v: TemplateVars) => string
  cta: string
  buildBodyHtml: (v: TemplateVars) => string
  buildBodyText: (v: TemplateVars) => string
}

const g = (v: TemplateVars) => (v.alias ? `hey ${v.alias.toLowerCase()},` : 'hey,')

export const TEMPLATES: Record<TemplateId, TemplateEntry> = {
  welcome: {
    id: 'welcome',
    identity: 'hello',
    emailClass: 'engagement',
    subject: () => "you're in.",
    preview: () => 'your space to say the thing you can\'t say anywhere else.',
    cta: 'come say it',
    buildBodyHtml: (v) => `<p style="margin:0 0 12px">${escapeHtml(g(v))}</p>
<p style="margin:0 0 8px">this is your space to say the thing you can't say anywhere else — no advice, no fixing, no one from your real life watching. just spill it, and see what actually happened next for people who've lived your exact thing.</p>`,
    buildBodyText: (v) => `${g(v)}

this is your space to say the thing you can't say anywhere else — no advice, no fixing, no one from your real life watching. just spill it, and see what actually happened next for people who've lived your exact thing.

come say it: ${v.deep_link ?? 'https://shutap.com'}`,
  },
  checkin_day1: {
    id: 'checkin_day1',
    identity: 'hello',
    emailClass: 'engagement',
    subject: () => 'how\'d you sleep on it?',
    preview: () => 'been thinking about what you spilled.',
    cta: 'open the check-in',
    buildBodyHtml: (v) => `<p style="margin:0 0 8px">${escapeHtml(g(v))}</p>
<p style="margin:0 0 8px">been thinking about ${escapeHtml(v.situation_hint || 'what you spilled')}. how'd you sleep on it?</p>`,
    buildBodyText: (v) => `${g(v)}

been thinking about ${v.situation_hint || 'what you spilled'}. how'd you sleep on it?

open the check-in: ${v.deep_link ?? ''}`,
  },
  checkin_day2: {
    id: 'checkin_day2',
    identity: 'hello',
    emailClass: 'engagement',
    subject: () => 'you good today?',
    preview: () => 'no pressure, just checking.',
    cta: 'open the check-in',
    buildBodyHtml: (v) => `<p style="margin:0 0 8px">${escapeHtml(g(v))}</p>
<p style="margin:0 0 8px">no pressure, just checking — you good today?</p>`,
    buildBodyText: (v) => `${g(v)}

no pressure, just checking — you good today?

open the check-in: ${v.deep_link ?? ''}`,
  },
  checkin_day3: {
    id: 'checkin_day3',
    identity: 'hello',
    emailClass: 'engagement',
    subject: () => 'ok be honest',
    preview: () => 'did you do anything or still stewing.',
    cta: 'open the check-in',
    buildBodyHtml: (v) => `<p style="margin:0 0 8px">${escapeHtml(g(v))}</p>
<p style="margin:0 0 8px">ok be honest — did you do anything or still stewing 😤</p>`,
    buildBodyText: (v) => `${g(v)}

ok be honest — did you do anything or still stewing 😤

open the check-in: ${v.deep_link ?? ''}`,
  },
  checkin_day7: {
    id: 'checkin_day7',
    identity: 'hello',
    emailClass: 'engagement',
    subject: () => 'where are things now?',
    preview: () => 'a week in.',
    cta: 'open the check-in',
    buildBodyHtml: (v) => `<p style="margin:0 0 8px">${escapeHtml(g(v))}</p>
<p style="margin:0 0 8px">a week in. where are things now?</p>`,
    buildBodyText: (v) => `${g(v)}

a week in. where are things now?

open the check-in: ${v.deep_link ?? ''}`,
  },
  checkin_day14: {
    id: 'checkin_day14',
    identity: 'hello',
    emailClass: 'engagement',
    subject: () => 'looking back — what happened?',
    preview: () => 'two weeks on.',
    cta: 'open the check-in',
    buildBodyHtml: (v) => `<p style="margin:0 0 8px">${escapeHtml(g(v))}</p>
<p style="margin:0 0 8px">two weeks on. looking back — what happened?</p>`,
    buildBodyText: (v) => `${g(v)}

two weeks on. looking back — what happened?

open the check-in: ${v.deep_link ?? ''}`,
  },
  checkin_day30: {
    id: 'checkin_day30',
    identity: 'hello',
    emailClass: 'engagement',
    subject: () => "still going? where's it at now?",
    preview: () => 'a month later.',
    cta: 'open the check-in',
    buildBodyHtml: (v) => `<p style="margin:0 0 8px">${escapeHtml(g(v))}</p>
<p style="margin:0 0 8px">a month later. still going? where's it at now?</p>`,
    buildBodyText: (v) => `${g(v)}

a month later. still going? where's it at now?

open the check-in: ${v.deep_link ?? ''}`,
  },
}

// Re-export helpers so render.ts can build the shell.
export { baseLayout, baseText, ctaButton }
