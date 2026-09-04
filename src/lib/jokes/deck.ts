// Client-safe joke-card vocabulary. No authored content, no prompts here —
// those live in deck.server.ts so the fallback pools never ship to a browser.

export const ANGLES: [slug: string, label: string, brief: string][] = [
  ['target_the_behavior', 'the behaviour', 'roast the specific thing they did'],
  ['target_the_guilt_trip', 'the guilt trip', 'roast the manipulation move'],
  ['target_the_double_standard', 'the double standard', 'roast the rule that applies to her and not to them'],
  ['target_the_timing', 'the timing', 'roast when they chose to do it'],
  ['absurdist_escalation', 'the escalation', 'extrapolate the behaviour to something ridiculous'],
  ['deadpan_understatement', 'the deadpan', 'the flattest possible statement of the absurdity'],
  ['the_comeback', 'the comeback', 'the line she wishes she had said in the moment'],
]

export const ANGLE_LABEL: Record<string, string> = Object.fromEntries(
  ANGLES.map((a) => [a[0], a[1]]),
)

export const ARCHETYPE_LABEL: Record<string, string> = {
  uninvited_visitor: 'Uninvited Visitor',
  backhanded_grandma: 'Backhanded Grandma',
  boundary_bulldozer: 'Boundary Bulldozer',
  favoritism_broadcaster: 'Favoritism Broadcaster',
  grandbaby_countdown_clock: 'Grandbaby Countdown Clock',
  silent_treatment_strategist: 'Silent Treatment Strategist',
  general: 'general',
}

export const ROMAN = ['I', 'II', 'III']

export function fitSize(n: number): string {
  return n <= 52 ? '19px' : n <= 80 ? '17px' : n <= 110 ? '15px' : '13px'
}

export type JokeCard = {
  id: string | null
  position: number
  angle: string
  angleLabel: string
  text: string
  used_fallback: boolean
  judge_score: number | null
  saved: boolean
  room_id?: string | null
  day?: string
}

export type JokeSet = {
  id: string
  clean_text: string
  archetype: string
  angles: string[]
  cards: (JokeCard | null)[]
}

export type JokeTier = 'guest' | 'free' | 'paying'
