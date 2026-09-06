/* Lifted verbatim from DCLogic.ONB in public/shutap/Landing.dc.html. */
export type OnbFrame = {
  eye?: boolean
  emoji?: string
  big: string
  rows: Array<[string, string]>
}

export const ONBOARDING_FRAMES: OnbFrame[] = [
  {
    eye: true,
    big: "this is where you\u2019re heard.",
    rows: [
      ['🤍', "real people sit with what you\u2019re carrying. no judging."],
      ['🗣', "advice only if you ask. otherwise, you\u2019re just heard."],
      ['🪶', "you sit under a pseudonym — your real name never shows."],
    ],
  },
  {
    emoji: '💬',
    big: 'spill it, then watch it move.',
    rows: [
      ['🫂', "someone who\u2019s lived your exact thing relates — \u201comg same.\u201d"],
      ['🌱', 'the eye checks in over the next days: what happened next?'],
      ['🪞', "that\u2019s your mirror forming — the shape of you, over time."],
    ],
  },
  {
    emoji: '🔒',
    big: 'safe enough to be honest.',
    rows: [
      ['🛡', 'i scrub out names & details before anything is seen.'],
      ['🆓', 'typing your situation, reading your set, and crisis help are always free.'],
      ['👋', "that\u2019s it — the room\u2019s open. say the thing."],
    ],
  },
]
