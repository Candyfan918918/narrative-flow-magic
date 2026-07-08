// Mirror guardrails — runs on every agent output before persistence.
// Hard rules from the spec: observational only, never advice or clinical.

export const DISTRICTS = ['self', 'career', 'love', 'family', 'social'] as const
export type District = (typeof DISTRICTS)[number]

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const
export type Rarity = (typeof RARITIES)[number]

export const DISTRICT_SIGIL: Record<District, string> = {
  self: '✸',
  career: '▲',
  love: '♥',
  family: '⌂',
  social: '✦',
}

export const DISTRICT_LABEL: Record<District, string> = {
  self: 'Personal',
  career: 'Career',
  love: 'Relationship',
  family: 'Family',
  social: 'Social',
}

export const DISTRICT_DEFAULT_EMOJI: Record<District, string> = {
  self: '🪞',
  career: '🦦',
  love: '💘',
  family: '🍵',
  social: '🪩',
}

export const RARITY_NUMERAL: Record<Rarity, string> = {
  common: 'I',
  uncommon: 'II',
  rare: 'III',
  epic: 'IV',
  legendary: 'V',
}

const ADVICE_TOKENS = [
  'you should', 'you need to', 'try to', 'try ', 'consider ',
  'i recommend', 'i suggest', 'my advice', "you ought", "you must",
  'go to therapy', 'see a therapist', 'talk to a',
]

const CLINICAL_TOKENS = [
  'anxiety disorder', 'depression', 'trauma', 'ptsd', 'bipolar',
  'narcissist', 'narcissistic', 'borderline', 'adhd', 'ocd',
  'attachment style', 'avoidant attachment', 'anxious attachment',
  'codependent', 'codependency', 'gaslighting',
]

const SHAMING_TOKENS = [
  "haven't moved", 'have not moved', 'not moved an inch', 'not moved',
  'you never', 'you always', 'pretended', 'you swore off', 'you swore',
  'you failed', "didn't even", 'did not even',
  'weaponize', 'flinch', 'flinched', 'shame on', 'pathetic',
  'not mysterious', 'coward', 'lazy', 'scared with',
]

export function rejectsAdviceOrClinical(text: string): boolean {
  const t = (text || '').toLowerCase()
  return (
    ADVICE_TOKENS.some((k) => t.includes(k)) ||
    CLINICAL_TOKENS.some((k) => t.includes(k)) ||
    SHAMING_TOKENS.some((k) => t.includes(k))
  )
}


const EMOJI_RE = /\p{Extended_Pictographic}/gu

export function countEmoji(s: string): number {
  return (s.match(EMOJI_RE) ?? []).length
}

export function firstEmoji(s: string): string | null {
  const m = (s ?? '').match(EMOJI_RE)
  return m ? m[0] : null
}

export function normalizeDistrict(d: string | undefined | null): District {
  const lc = (d ?? '').toLowerCase() as District
  return (DISTRICTS as readonly string[]).includes(lc) ? (lc as District) : 'self'
}

export function normalizeRarity(r: string | undefined | null): Rarity {
  const lc = (r ?? '').toLowerCase() as Rarity
  return (RARITIES as readonly string[]).includes(lc) ? (lc as Rarity) : 'common'
}

export function sanitizeName(name: string): string {
  const stripped = (name || '').replace(EMOJI_RE, '').trim()
  const words = stripped.split(/\s+/).filter(Boolean).slice(0, 4)
  return words
    .map((w) => w.length > 1 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase())
    .join(' ')
    .slice(0, 40) || 'Pattern Forming'
}

export function sanitizeEmoji(input: string | undefined, district: District): string {
  const e = firstEmoji(input ?? '')
  return e ?? DISTRICT_DEFAULT_EMOJI[district]
}

export function sanitizePunch(text: string, maxLen = 140): string {
  if (!text) return ''
  const trimmed = text.trim().toLowerCase().slice(0, maxLen)
  if (rejectsAdviceOrClinical(trimmed)) return ''
  return trimmed
}

// Authored fallbacks (never blank). Warm, supportive register — every line
// should read like something a perceptive close friend would say that makes
// you feel seen, never roasted.
const PUNCH_FALLBACKS: Record<District, string[]> = {
  self: [
    'you keep coming back to this — that\'s the work, quietly happening.',
    'noticing the loop is already changing how it feels.',
  ],
  career: [
    'you\'re holding a lot; it makes sense the meeting feels loud.',
    'the care you put into the work is why this one lands heavy.',
  ],
  love: [
    'the words are taking their time because they matter to you.',
    'wanting to get it right is a form of love, even when it stalls.',
  ],
  family: [
    'you\'re carrying an old script tenderly, one dinner at a time.',
    'showing up for that room takes more than the room ever sees.',
  ],
  social: [
    'you notice who noticed you — that\'s a soft, human thing.',
    'the reply that took the longest is the one you cared about most.',
  ],
}

export function fallbackPunch(district: District): string {
  const pool = PUNCH_FALLBACKS[district]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function fallbackRecord(): string {
  const pool = [
    'noticed, gently.', 'held here.', 'seen, kept.',
    'quietly logged.', 'witnessed.',
  ]
  return pool[Math.floor(Math.random() * pool.length)]
}

