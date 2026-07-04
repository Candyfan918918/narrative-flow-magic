// Central sender-identity registry. Every Resend send MUST route through
// one of these identities — no hardcoded from addresses elsewhere.

export type IdentityId = 'hello' | 'safety' | 'privacy' | 'legal'

export type Identity = {
  id: IdentityId
  fromName: string
  fromAddress: string // bare email, e.g. hello@shutap.com
  replyTo: string // same as fromAddress
}

export const IDENTITIES: Record<IdentityId, Identity> = {
  hello: {
    id: 'hello',
    fromName: 'shutap',
    fromAddress: 'hello@shutap.com',
    replyTo: 'hello@shutap.com',
  },
  safety: {
    id: 'safety',
    fromName: 'shutap safety',
    fromAddress: 'safety@shutap.com',
    replyTo: 'safety@shutap.com',
  },
  privacy: {
    id: 'privacy',
    fromName: 'shutap privacy',
    fromAddress: 'privacy@shutap.com',
    replyTo: 'privacy@shutap.com',
  },
  legal: {
    id: 'legal',
    fromName: 'shutap legal',
    fromAddress: 'legal@shutap.com',
    replyTo: 'legal@shutap.com',
  },
}

// Formatted "Name <addr>" string for Resend `from` field.
export function formatFrom(identity: Identity): string {
  return `${identity.fromName} <${identity.fromAddress}>`
}
