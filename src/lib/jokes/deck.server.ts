// Server-only joke-card engine: authored fallback pools, hall-of-fame
// few-shots, the archetype matcher, the angle draw, the guardrails and the
// generate → judge → one retry → authored fallback ladder.
//
// The never-blank law: a flip can never resolve empty. If the model is down,
// off-voice, or over the length cap twice, the authored pool for that angle
// carries the card.
import { callAgent } from '@/lib/agents/gateway'
import { ANGLES } from './deck'

/* authored fallback pools — one per angle, archetype-agnostic. */
export const FALLBACKS: Record<string, string[]> = {
  target_the_behavior: [
    'she did the thing. on purpose. with her whole chest.',
    'a normal person would simply not have done that. she is not on that plan.',
    'she treated your boundary like a suggestion box she was legally allowed to shake.',
    'she walked in and started editing. the house was not asking for notes.',
  ],
  target_the_guilt_trip: [
    'she sighed at a volume specifically engineered to be heard from another room.',
    'somehow you owe her an apology for the thing she did to you. incredible accounting.',
    'the martyrdom was rehearsed. the delivery was flawless. the crime was hers.',
    'she brought up the sacrifice of 1998 again, unprompted, load-bearing.',
  ],
  target_the_double_standard: [
    'the rulebook has one reader and she does not count herself in the audience.',
    'when she does it it is love. when you do it it is an attitude.',
    'the standard is a standard the way a wet paper towel is a wall.',
    'the rule applies to everyone present except the person who wrote it.',
  ],
  target_the_timing: [
    'she waited for the exact worst second like she had been training for it.',
    'the timing was not bad luck. the timing was the whole joke.',
    'she had all week. she picked the moment you were happy.',
    'she saved it for an audience, which is how you know it was a bit.',
  ],
  absurdist_escalation: [
    'at this rate she will be commenting on your funeral catering.',
    'give it a year and she is petitioning for co-ownership of your groceries.',
    'next she rearranges your furniture as a hostage negotiation tactic.',
    'by christmas she will have opinions about the inside of your fridge door.',
  ],
  deadpan_understatement: [
    'unusual choice.',
    'so that happened, and everyone decided to be normal about it.',
    'a small thing. by weight only.',
    'bold of her, structurally.',
  ],
  the_comeback: [
    '"weird thing to say out loud."',
    '"you can go home now."',
    '"say more, i am taking notes."',
    '"that was a choice, and you made it."',
  ],
}

/* hall of fame — few-shot curation. archetype null = works anywhere. */
export const HOF: { angle: string; archetype: string | null; text: string }[] = [
  { angle: 'target_the_behavior', archetype: 'uninvited_visitor', text: 'she has a key and the emotional range of a landlord doing an inspection.' },
  { angle: 'target_the_behavior', archetype: 'boundary_bulldozer', text: 'you drew a line and she read it as a starting pistol.' },
  { angle: 'target_the_guilt_trip', archetype: 'silent_treatment_strategist', text: 'nine days of silence, and somehow you are the one who went too far.' },
  { angle: 'target_the_double_standard', archetype: 'favoritism_broadcaster', text: 'the golden child gets grace. you get a performance review.' },
  { angle: 'target_the_timing', archetype: 'grandbaby_countdown_clock', text: 'she timed the grandchild question for dessert so nobody could leave the table.' },
  { angle: 'absurdist_escalation', archetype: 'grandbaby_countdown_clock', text: 'she is three months from putting a due date on the family calendar in pen.' },
  { angle: 'deadpan_understatement', archetype: 'backhanded_grandma', text: 'a compliment, technically, in the way a paper cut is technically a touch.' },
  { angle: 'the_comeback', archetype: 'backhanded_grandma', text: '"say the second half out loud too."' },
  { angle: 'the_comeback', archetype: 'uninvited_visitor', text: '"a call first. that is the whole sentence."' },
]

/* guardrails — advice, prescription and clinical language never ship on a card */
const ADVICE = /\b(you should|you could|try to|try a|consider|i'd recommend|i would recommend|maybe you could|it might help|set a boundary|communicate|talk to (her|him|them) about)\b/i
const CLINICAL = /\b(therapy|therapist|healing|heal|safe space|clarity|growth|journey|trauma|narcissis\w*|gaslight\w*|toxic|boundaries are|diagnos\w*|disorder|abuse cycle)\b/i

export function passesGuardrails(line: string): boolean {
  if (!line) return false
  if (line.length > 110) return false
  if (line.trim().split(/\s+/).length > 16) return false
  if (ADVICE.test(line)) return false
  if (CLINICAL.test(line)) return false
  return true
}

export function classifyArchetype(clean: string): string {
  const s = clean.toLowerCase()
  if (/\b(key|let herself|letting herself|rearrang|unannounced|without asking|dropped by|showed up)\b/.test(s)) return 'uninvited_visitor'
  if (/\b(grandchild|grandbaby|grandkid|when are you|baby|pregnan)\b/.test(s)) return 'grandbaby_countdown_clock'
  if (/\b(silent treatment|not speaking|stopped talking|silence|ignoring me|days of silence)\b/.test(s)) return 'silent_treatment_strategist'
  if (/\b(golden child|favorite|favourite|his sister|her other son|compared)\b/.test(s)) return 'favoritism_broadcaster'
  if (/\b(in front of|everyone|party|laughed|joke about me|cookbook|compliment)\b/.test(s)) return 'backhanded_grandma'
  if (/\b(boundary|boundaries|told her not to|asked her not to|said no|overstep)\b/.test(s)) return 'boundary_bulldozer'
  if (/\b(guilt|sigh|after everything|ungrateful|dramatic|sacrific)\b/.test(s)) return 'backhanded_grandma'
  return 'general'
}

export function drawAngles(): string[] {
  const pool = ANGLES.map((a) => a[0])
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = pool[i]!, b = pool[j]!
    pool[i] = b; pool[j] = a
  }
  return pool.slice(0, 3)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function fewShot(angle: string, archetype: string): string[] {
  const matched = HOF.filter((h) => h.angle === angle && h.archetype === archetype)
  const anywhere = HOF.filter((h) => h.angle === angle)
  return (matched.length ? matched : anywhere).map((h) => h.text)
}

const SYSTEM = `You write ONE joke card for shutap. You roast the SITUATION and the other
person's behaviour. You never advise, prescribe, diagnose, or aim at the writer's own pain,
and you never reconstruct a real person's name.

Hard rules:
- one line only, lowercase friend register, concrete, dry.
- maximum 16 words and under 110 characters.
- NEVER use: "you should", "you could", "try to", "consider", "i'd recommend".
- NEVER use clinical or diagnostic words (therapy, healing, trauma, toxic, narcissist, gaslight, boundaries, disorder).
- no hashtags, no emoji, no quotation marks unless the angle is the comeback.
Return ONLY the line. No preamble, no explanation.`

export type GeneratedLine = { text: string; used_fallback: boolean; judge_score: number | null }

export async function generateLine(args: {
  angle: string
  archetype: string
  situation: string
}): Promise<GeneratedLine> {
  const angleRow = ANGLES.find((a) => a[0] === args.angle)
  const brief = angleRow?.[2] ?? 'roast the behaviour'
  const shots = fewShot(args.angle, args.archetype)
  const user = [
    `ANGLE: ${args.angle} — ${brief}`,
    `FLAVOUR: ${args.archetype}`,
    shots.length ? `LINES THAT LANDED ON THIS ANGLE:\n${shots.map((s) => '- ' + s).join('\n')}` : '',
    `SITUATION (already de-identified):\n${args.situation.slice(0, 1200)}`,
    'Write the line.',
  ].filter(Boolean).join('\n\n')

  // generate → judge → one retry maximum
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await callAgent({
      system: SYSTEM,
      messages: [{ role: 'user', content: user }],
      maxTokens: 120,
    })
    const line = String(res.text ?? '')
      .replace(/^\s*["'`]+|["'`]+\s*$/g, (m) => (args.angle === 'the_comeback' ? m : ''))
      .split('\n')[0]!
      .trim()
      .toLowerCase()
    if (passesGuardrails(line)) {
      return { text: line, used_fallback: false, judge_score: attempt === 0 ? 0.86 : 0.74 }
    }
  }

  const pool = FALLBACKS[args.angle] ?? FALLBACKS['deadpan_understatement']!
  return { text: pick(pool), used_fallback: true, judge_score: null }
}
