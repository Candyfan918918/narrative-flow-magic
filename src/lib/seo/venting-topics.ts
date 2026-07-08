// Vent topic metadata — read-only. Categories mirror the values already
// present in the seed rooms (family, work, romance, friendship, parenting,
// money, roommates, stranger). Copy is honest and short; no invented stats.

export type VentTopic = {
  slug: string
  label: string
  h1: string
  intro: string
  topicQuestion: { q: string; a: string }
}

export const VENT_TOPICS: VentTopic[] = [
  {
    slug: 'family',
    label: 'family',
    h1: 'somewhere to vent about family.',
    intro:
      "family is the group chat you can't leave. parents, siblings, in-laws, the guilt that shows up before the words do — sit with people who've lived your exact thing.",
    topicQuestion: {
      q: 'i can\u2019t say this in front of my family — is that ok here?',
      a: "yes. shutap is pseudonymous — no one at the family dinner can find your room. spill what you actually think; the room stays outside your real life.",
    },
  },
  {
    slug: 'work',
    label: 'work',
    h1: 'somewhere to vent about work.',
    intro:
      'bosses, coworkers, burnout, the job everyone tells you to be grateful for — say the thing you can\u2019t say on slack.',
    topicQuestion: {
      q: 'can my employer find my spill?',
      a: 'no. rooms are pseudonymous. real names, emails, and workplace details are scrubbed before anything is seen.',
    },
  },
  {
    slug: 'romance',
    label: 'romance',
    h1: 'somewhere to vent about romance.',
    intro:
      'dating, situationships, the person you keep almost leaving. spill it; someone here has lived your exact thing.',
    topicQuestion: {
      q: 'my partner will never see this, right?',
      a: 'right. pseudonymous means your alias sits under the spill — never your name. what you post here does not travel back.',
    },
  },
  {
    slug: 'friendship',
    label: 'friendship',
    h1: 'somewhere to vent about friendship.',
    intro:
      'the fade-out, the group chat drama, the friend who never says sorry. it counts. sit in a room with people who\u2019ve been there.',
    topicQuestion: {
      q: "is it dramatic to vent about friends?",
      a: "no. friend grief is real grief. the rooms here take it seriously without making you defend that it hurts.",
    },
  },
  {
    slug: 'parenting',
    label: 'parenting',
    h1: 'somewhere to vent about parenting.',
    intro:
      'the tantrum you handled badly. the day you didn\u2019t like being a parent. the thing you can\u2019t say to the other parents at pickup.',
    topicQuestion: {
      q: 'will i get judged for saying the thing?',
      a: 'the room is people who\u2019ve lived it — not the school group chat. you can be honest without a public log.',
    },
  },
  {
    slug: 'money',
    label: 'money',
    h1: 'somewhere to vent about money.',
    intro:
      'debt, the paycheck that doesn\u2019t clear, the friend who kept borrowing. name the thing.',
    topicQuestion: {
      q: 'is it ok to vent about money without asking for advice?',
      a: 'yes. every room chooses between \u201cbeing heard\u201d and \u201copen to advice.\u201d you say what you want.',
    },
  },
  {
    slug: 'roommates',
    label: 'roommates',
    h1: 'somewhere to vent about roommates.',
    intro:
      'the dishes, the passive notes on the fridge, the person you signed a lease with and now barely speak to.',
    topicQuestion: {
      q: 'can i vent without starting a fight at home?',
      a: 'that is the whole point. pseudonymous rooms let you say what would blow up in your kitchen.',
    },
  },
  {
    slug: 'stranger',
    label: 'stranger',
    h1: "somewhere to vent about a stranger who won\u2019t leave your head.",
    intro:
      'the stranger on the train. the person who dropped their coffee and cried. the barista who remembered your order and made your week. small encounters count too.',
    topicQuestion: {
      q: 'these feel small — do they belong here?',
      a: 'they do. small moments carry weight. the room will sit in.',
    },
  },
]

export function findVentTopic(slug: string): VentTopic | undefined {
  return VENT_TOPICS.find((t) => t.slug === slug)
}
