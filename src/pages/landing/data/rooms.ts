/* Fallback ROOMS lifted verbatim from public/shutap/Landing.dc.html (DCLogic.FALLBACK_ROOMS).
   Kept identical so the React feed preview reads the same seed the iframe does. */
export type LandingRoom = {
  id: string
  alias: string
  emoji: string
  title: string
  support: 'heard' | 'advice'
  relates: number
  sitting: number
  hours: string
  reactions: { heard: number; same: number; strong: number; time: number; brave: number }
  body: string
}

export const FALLBACK_ROOMS: LandingRoom[] = [
  {
    id: '0', alias: 'Quiet Nigerian Swan', emoji: '🦢',
    title: "I told my mum I've been struggling for months. she cried and said she never knew.",
    support: 'heard', relates: 47, sitting: 18, hours: '2h',
    reactions: { heard: 55, same: 28, strong: 10, time: 5, brave: 2 },
    body: "I've been holding this for a long time. managing it, mostly. it gets hard in the evenings. last week I finally told her — sitting at her kitchen table, hands around tea, trying to find normal words for it. she went very quiet and then she cried. not out of pity. out of not knowing. that was somehow harder than anything.",
  },
  {
    id: '1', alias: 'Defiant Kenyan Lion', emoji: '🦁',
    title: 'I left a six-figure job and nobody in my family has spoken to me since.',
    support: 'advice', relates: 83, sitting: 26, hours: '5h',
    reactions: { heard: 38, same: 41, strong: 12, time: 6, brave: 3 },
    body: "I gave seven years to that job. the salary was real, the title was real, and the thing it was slowly doing to me was also real. I left in January. I haven't regretted it for one day. but I also haven't spoken to my dad, my sister, or my aunt since the announcement. I don't know if I'm supposed to wait them out or reach out first.",
  },
  {
    id: '2', alias: 'Mortified Polish Hedgehog', emoji: '🦔',
    title: 'I wrote a letter to my ex and sent it by accident to our whole group chat.',
    support: 'heard', relates: 124, sitting: 11, hours: '6h',
    reactions: { heard: 22, same: 58, strong: 5, time: 10, brave: 5 },
    body: "full letter. three months of feelings. sent at 2am to the group chat we're both still in. the one with twelve people in it. I screenshotted the phone like that would somehow undo it. it did not undo it. fourteen people have now read my whole inner life. one of them left a heart emoji. I don't know if that's kind or devastating.",
  },
  {
    id: '3', alias: 'Patient Indian Dove', emoji: '🕊',
    title: "I've been going to therapy for two years and I finally cried today.",
    support: 'heard', relates: 211, sitting: 34, hours: '1d',
    reactions: { heard: 61, same: 24, strong: 8, time: 5, brave: 2 },
    body: "i don't know what shifted. same room, same chair, same questions we've been circling for two years. she asked about my mother and something just — opened. i sat there ugly-crying for twenty minutes. on the train home I felt lighter than I have in years. also embarrassed. also relieved. i wanted to tell someone and this felt like the right room.",
  },
]
