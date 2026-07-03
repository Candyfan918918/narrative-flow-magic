// 20 starter situation hubs (5 per pillar). Hand-written, gated on §8 unique-data
// before related-rooms / outcome-aggregate render. Slugs are verbatim-question style.

export type PillarSlug = "relationships" | "marriage" | "family" | "career";

export interface SituationHub {
  slug: string;
  pillar: PillarSlug;
  /** Verbatim question — also the H1. */
  question: string;
  /** 40–60 word answer-first paragraph. */
  answer: string;
  /** People-Also-Ask cluster. 3–5 entries. */
  paa: { q: string; a: string }[];
}

export const HUBS: SituationHub[] = [
  // ── relationships ──────────────────────────────────────────────
  {
    slug: "is-it-normal-to-feel-lonely-in-a-relationship",
    pillar: "relationships",
    question: "is it normal to feel lonely in a relationship?",
    answer:
      "Yes — and it's more common than the relationship advice industry admits. Loneliness inside a relationship usually means the emotional channel has gone quiet, not that the relationship is over. A common way people describe it is living with a roommate who knows your coffee order but not what you're scared of. Naming it out loud is usually step one.",
    paa: [
      { q: "Why do I feel lonely even though I'm not single?", a: "Loneliness tracks emotional intimacy, not physical proximity. You can sleep next to someone every night and still feel unseen." },
      { q: "Should I leave if I feel lonely in my relationship?", a: "Not automatically. Loneliness is a signal to investigate — not a verdict. Many people repair it; others use it as the nudge they needed." },
      { q: "How do I tell my partner I feel lonely without it becoming a fight?", a: "Lead with the feeling, not the indictment. \"I've been feeling lonely lately\" lands differently than \"you never talk to me.\"" },
    ],
  },
  {
    slug: "am-i-overreacting-or-is-this-a-red-flag",
    pillar: "relationships",
    question: "am I overreacting, or is this a red flag?",
    answer:
      "If you're asking, your gut already answered. The \"am I overreacting\" loop is usually what happens after months of small things you talked yourself out of. Real overreaction tends to feel embarrassing in retrospect; a red flag tends to feel obvious in retrospect. Write down what happened. Read it back in a week. You'll know.",
    paa: [
      { q: "Why do I keep second-guessing my own instincts?", a: "Usually because someone else benefits from you doing that. People who were gaslit as kids do it on autopilot as adults." },
      { q: "What counts as a red flag vs. a yellow flag?", a: "Red = the behavior itself is the problem (lying, contempt, control). Yellow = the pattern is the problem (always late, always defensive)." },
      { q: "Is it a red flag if only I see it?", a: "Sometimes. Other times your friends are being polite. Ask the one friend who'd actually tell you." },
    ],
  },
  {
    slug: "why-do-i-feel-guilty-after-going-no-contact",
    pillar: "relationships",
    question: "why do I feel guilty after going no-contact?",
    answer:
      "Because guilt and doing-the-right-thing aren't opposites. No-contact protects you from someone whose presence costs more than it pays — but your nervous system was trained to keep them comfortable, so it'll keep ringing the bell. The guilt fades. It usually doesn't fade in week one. Most people here say it takes ~3 months.",
    paa: [
      { q: "Does the guilt ever fully go away?", a: "It dulls. Most people stop feeling it daily by month 3, and only notice it on birthdays and holidays after that." },
      { q: "Am I a bad person for going no-contact with a parent?", a: "No. Estrangement is usually the last option, not the first." },
      { q: "Should I break no-contact if they're sick?", a: "Only on your terms, with a plan for after. Crisis doesn't undo the reason you went no-contact." },
    ],
  },
  {
    slug: "is-it-bad-that-i-went-through-his-phone",
    pillar: "relationships",
    question: "is it bad that I went through his phone?",
    answer:
      "It's not great — but the more useful question is what made you do it. Phone-checking is almost never random; it's the body acting on information the brain hasn't admitted yet. If you found something: trust the finding, not the method. If you found nothing: trust the urge, and figure out what your gut is reacting to.",
    paa: [
      { q: "Should I tell him I went through his phone?", a: "Depends on what you found. If nothing — work on what made you reach for it. If something — lead with what you found, not how." },
      { q: "Why did I look if I trust him?", a: "Often it's not him you stopped trusting — it's a pattern, a tone shift, a gut signal you couldn't name." },
      { q: "Is checking your partner's phone a sign the relationship is over?", a: "Not always. It's a sign something is unspoken. The relationship is over when the unspoken thing can't be said." },
    ],
  },
  {
    slug: "how-do-you-know-when-youve-outgrown-someone",
    pillar: "relationships",
    question: "how do you know when you've outgrown someone?",
    answer:
      "When you start editing yourself to keep the connection comfortable for them. Outgrowing isn't dramatic — it's quiet. You stop sharing the wins because they land flat, you stop sharing the struggles because the response costs more energy than the comfort. The relationship doesn't get worse. It just gets smaller.",
    paa: [
      { q: "Is outgrowing someone the same as falling out of love?", a: "Not always. You can still love someone and notice the version of you they know is two years old." },
      { q: "Do I have to end it just because I've outgrown them?", a: "No. Some relationships shrink to fit a new role — old friend, occasional dinner. Others don't survive the shrink." },
      { q: "Why do I feel guilty for outgrowing a friend?", a: "Because nobody did anything wrong. Guilt without a villain is just grief." },
    ],
  },

  // ── marriage ──────────────────────────────────────────────────
  {
    slug: "is-it-normal-to-feel-invisible-in-my-marriage",
    pillar: "marriage",
    question: "is it normal to feel invisible in my marriage?",
    answer:
      "Yes, and it's one of the most common things people bring here. Invisible in a marriage usually means the maintenance got automated — schedules, kids, logistics — and the noticing stopped. The fix isn't grand gestures; it's the small re-noticing. People who repaired it say it started with one honest sentence, not a weekend away.",
    paa: [
      { q: "Why does my spouse stop seeing me after years together?", a: "Familiarity dulls attention. It's not malice; it's how brains conserve energy. It can be reversed deliberately." },
      { q: "Is feeling invisible a reason to leave?", a: "It's a reason to talk. If the talk goes nowhere twice, it becomes a reason to reconsider." },
      { q: "How do I tell my husband I feel invisible?", a: "Use a specific recent moment, not a generalization. \"Last Tuesday I told you about X and you kept scrolling\" beats \"you never listen.\"" },
    ],
  },
  {
    slug: "should-i-stay-married-for-the-kids",
    pillar: "marriage",
    question: "should I stay married for the kids?",
    answer:
      "The research is more nuanced than either camp admits: kids do best with low-conflict parents, married or not. A high-conflict intact marriage is worse for kids than a respectful divorce. A low-conflict, low-warmth marriage is a harder call. There's no clean answer — but \"for the kids\" is rarely the only reason once people sit with it.",
    paa: [
      { q: "Do kids actually do better with married parents?", a: "Only when the marriage is low-conflict. High-conflict households outperform divorce on almost no metric for kids." },
      { q: "At what age does divorce hurt kids the least?", a: "There's no safe age. The biggest predictor of how kids handle divorce is how the parents handle each other after." },
      { q: "Will my kids resent me if I leave?", a: "Some do, for a while. Most resent staying-and-being-miserable more once they're old enough to see it." },
    ],
  },
  {
    slug: "why-dont-i-feel-anything-for-my-husband-anymore",
    pillar: "marriage",
    question: "why don't I feel anything for my husband anymore?",
    answer:
      "Flatness usually isn't the absence of love — it's the nervous system's response to long, quiet disappointment. The romantic-comedy version of \"I love you\" was never sustainable; what replaces it is either deeper attention or numb coexistence. The first is hard work that often works. The second is the default if nobody intervenes.",
    paa: [
      { q: "Is feeling nothing worse than fighting?", a: "Often yes. Fighting means you still care what they think. Numbness means you stopped." },
      { q: "Can you fall back in love with your husband?", a: "Yes, but not by trying to feel it. You build the conditions and the feeling follows — date nights without phones, real conversations, novelty." },
      { q: "Is it normal to love your husband but not be in love?", a: "Common, yes. Whether it's livable is a separate question, and only you get to answer it." },
    ],
  },
  {
    slug: "is-it-normal-to-not-want-sex-with-my-husband",
    pillar: "marriage",
    question: "is it normal to not want sex with my husband?",
    answer:
      "Extremely. Desire in long-term relationships is responsive, not spontaneous — meaning it shows up after connection, not before. If you feel like a manager, a mom, and a calendar to your husband all day, your body won't switch into wanting him at 10pm. The fix is rarely about the sex; it's about what happens at 8pm.",
    paa: [
      { q: "Why do I lose attraction to my husband after kids?", a: "Identity collapse, sleep debt, and being touched all day without being seen. Common, and reversible." },
      { q: "Is a sexless marriage doomed?", a: "Not if both people are okay with it. Sexless marriages fail when one person isn't and won't say so." },
      { q: "How do I tell my husband I don't want sex without breaking him?", a: "Frame it as \"not now / not this way\" rather than \"not you.\" The story he tells himself is the part that wounds." },
    ],
  },
  {
    slug: "how-do-people-know-when-their-marriage-is-over",
    pillar: "marriage",
    question: "how do people know when their marriage is over?",
    answer:
      "Usually they knew long before they admitted it. The most common marker people here describe is contempt — not anger, contempt. When you stop being annoyed and start being repulsed, that's the line. The second marker is when picturing your life without them feels like relief, not grief.",
    paa: [
      { q: "What's the #1 predictor of divorce?", a: "Contempt, per the Gottman research. Not conflict — contempt." },
      { q: "Is wanting to leave the same as it being over?", a: "No. Most people who want to leave once stay and repair. The ones who leave usually wanted to for years first." },
      { q: "How long should you try before ending a marriage?", a: "Long enough to be sure you tried; short enough that you don't lose another decade to certainty." },
    ],
  },

  // ── family ─────────────────────────────────────────────────────
  {
    slug: "is-it-normal-to-not-like-my-own-mother",
    pillar: "family",
    question: "is it normal to not like my own mother?",
    answer:
      "Yes — and the guilt about it is usually worse than the feeling itself. \"Like\" is different from \"love.\" You can love your mother and not enjoy her company, not trust her with your real life, not want her opinion. None of that makes you a bad daughter; most of it makes you an adult who's been paying attention.",
    paa: [
      { q: "Is it wrong to dislike your mother?", a: "No. It's information. The question is what you do with it — distance, boundaries, or repair." },
      { q: "Why do I feel guilty for not liking my mom?", a: "Because the cultural script says you have to. Scripts aren't truth — they're scripts." },
      { q: "Can a daughter-mother relationship be repaired?", a: "Sometimes, if both people are willing. Usually only one is, which is why most repair is unilateral — you change the rules of engagement." },
    ],
  },
  {
    slug: "how-do-i-set-boundaries-with-my-parents-without-the-guilt",
    pillar: "family",
    question: "how do I set boundaries with my parents without the guilt?",
    answer:
      "You don't. The guilt comes free with the boundary; the trick is acting on the boundary anyway. Guilt is the toll, not the sign you're wrong. People here describe it as \"feeling like a bad daughter while doing the right thing for the first time.\" That feeling fades. The boundary holds.",
    paa: [
      { q: "Why do my parents react badly to boundaries?", a: "Because the old system worked for them. Any change in the system feels like loss to whoever was getting more out of it." },
      { q: "What's a healthy boundary with parents?", a: "Anything you can hold without resentment. If you need to explain it three times, it's a request — not a boundary." },
      { q: "Should I cut my parents off completely?", a: "Usually low-contact works before no-contact does. No-contact is the option you keep in your pocket if low-contact fails." },
    ],
  },
  {
    slug: "am-i-wrong-for-not-inviting-a-family-member-to-my-wedding",
    pillar: "family",
    question: "am I wrong for not inviting a family member to my wedding?",
    answer:
      "If you're asking, you've already weighed it more carefully than most people on the guest list. The wedding industry treats family invites as automatic; they're not. You're allowed to keep a person who hurts you out of one of the most photographed days of your life. The fallout is real. So is the alternative.",
    paa: [
      { q: "How do I tell family I'm not inviting someone?", a: "Short, calm, no negotiation. \"X isn't coming. I'm not going to debate it.\" Then change the subject." },
      { q: "Will I regret not inviting them?", a: "Some people do, most don't. The people who regret it usually wished they'd been clearer, not softer." },
      { q: "What if other family won't come because of it?", a: "That's their choice. You're not responsible for managing other adults' loyalty tests." },
    ],
  },
  {
    slug: "is-it-okay-to-go-low-contact-with-toxic-parents",
    pillar: "family",
    question: "is it okay to go low-contact with toxic parents?",
    answer:
      "Yes. Low-contact is one of the most under-prescribed tools in adult life. It's not a punishment and it's not the same as cutting them off — it's reducing the surface area where they can keep doing the thing. Most people who go low-contact say their mental health improved within weeks and their parents' behavior didn't get worse.",
    paa: [
      { q: "What does low-contact actually look like?", a: "Holiday-only visits, no phone calls, texts on your schedule, no sharing real-life updates. Whatever lowers the cost." },
      { q: "Do I need a reason to go low-contact?", a: "\"It's better for me\" is a reason. You don't owe a trial transcript." },
      { q: "Will my parents change if I go low-contact?", a: "Rarely. Low-contact isn't a strategy to fix them; it's a strategy to protect you." },
    ],
  },
  {
    slug: "why-does-my-family-make-me-feel-small",
    pillar: "family",
    question: "why does my family make me feel small?",
    answer:
      "Because they knew the smaller version of you first, and most families freeze you at the age they understood you best. The role you had at 12 — the responsible one, the dramatic one, the difficult one — is the role they still cast you in at 32. It's not personal. It's also not your job to keep playing it.",
    paa: [
      { q: "Why do I regress around my family?", a: "Your nervous system rehearsed those dynamics for 18 years. It re-runs them in seconds when the cues come back." },
      { q: "How do I stop letting my family get to me?", a: "Shorter visits, an exit plan, and a person you can text from the bathroom. Distance does most of the work." },
      { q: "Is it normal to dread seeing family?", a: "Common. If it's every time and intense, it's worth taking seriously — the body keeps a tally." },
    ],
  },

  // ── career ─────────────────────────────────────────────────────
  {
    slug: "is-it-normal-to-cry-at-work",
    pillar: "career",
    question: "is it normal to cry at work?",
    answer:
      "Yes. Crying at work usually isn't about the moment — it's the body releasing pressure that's been building for weeks. Most people here describe it the same way: a tiny thing happens (a Slack message, a meeting that ran long) and the wall comes down. It doesn't mean you're weak. It means you've been holding it for too long.",
    paa: [
      { q: "Will crying at work hurt my career?", a: "Usually less than people fear. Most colleagues are kinder about it in the moment than the inner critic is afterward." },
      { q: "Should I apologize for crying at work?", a: "No need to over-apologize. \"Sorry, rough week\" closes the loop. Don't make it the meeting." },
      { q: "Why am I suddenly crying at work for no reason?", a: "There's a reason — it's just not the trigger. Look at the last 4 weeks, not the last 4 minutes." },
    ],
  },
  {
    slug: "should-i-quit-a-job-everyone-thinks-is-great",
    pillar: "career",
    question: "should I quit a job everyone thinks is great?",
    answer:
      "If \"everyone\" thinks it's great and you don't, \"everyone\" doesn't have to do the job. Prestige is a tax other people pay no part of. The question isn't whether the job is objectively good — it's whether the cost of staying is lower than the cost of leaving. For most people who eventually leave, it was already lower for a year.",
    paa: [
      { q: "Why do I feel guilty for wanting to quit a good job?", a: "Because you were taught to be grateful for things other people would want. Gratitude and unhappiness aren't mutually exclusive." },
      { q: "How do I know if I should quit?", a: "If you've drafted the resignation email more than three times, the decision is already made — you're just waiting for permission." },
      { q: "Should I quit without another job lined up?", a: "Sometimes. Runway > resume in the long run if the job is wrecking you." },
    ],
  },
  {
    slug: "how-do-i-know-if-im-underpaid",
    pillar: "career",
    question: "how do I know if I'm underpaid?",
    answer:
      "Three signals, in order: (1) recent hires at your title make more than you, (2) recruiters routinely pitch roles 20%+ above your current comp, (3) your manager dodges the comp conversation. Any two of those and you're underpaid. Levels.fyi and Glassdoor are noisy but directionally right; the most accurate data is people one job ahead of you.",
    paa: [
      { q: "What's the average raise you should get?", a: "Standard merit is 3–5%. Promotion raises are 10–20%. If you've been doing the next-level job, neither is enough." },
      { q: "How do I ask for a raise without sounding entitled?", a: "Bring the market data and the scope change. Don't bring your bills." },
      { q: "Is it better to job-hop or stay loyal?", a: "Job-hopping pays more, almost always. Loyalty pays in trust and optionality, which is real but doesn't show up in your bank account." },
    ],
  },
  {
    slug: "why-do-i-feel-guilty-taking-time-off",
    pillar: "career",
    question: "why do I feel guilty taking time off?",
    answer:
      "Because the work culture you absorbed before you had words for it taught you that being available = being valuable. Time off triggers the same alarm as falling behind, even when nothing is actually behind. The guilt is the system working as designed. The fact that you noticed it is the first step out.",
    paa: [
      { q: "Why can't I relax on vacation?", a: "Because your nervous system was on high-alert for months. It doesn't switch off in 48 hours — usually takes 5–7 days to fully exhale." },
      { q: "Should I check email on vacation?", a: "Once a day, capped at 15 minutes, is the compromise most people land on. Zero is better but rarely sustainable in the first year." },
      { q: "Is it bad to take a mental health day?", a: "No. The shame about taking them is more damaging to your career long-term than the days themselves." },
    ],
  },
  {
    slug: "how-do-you-know-when-to-quit-without-another-job-lined-up",
    pillar: "career",
    question: "how do you know when to quit without another job lined up?",
    answer:
      "When the math works and the body says so. The math: runway covers 6–9 months at your real expenses (not the optimistic version). The body: you're getting sick more, sleeping worse, and Sunday night feels like Tuesday. People here who quit without a job almost universally say they wished they'd done it three months earlier.",
    paa: [
      { q: "How much runway do I need to quit?", a: "Most people say 6 months minimum, 9 to feel okay, 12 to feel free. Less is doable; it's just harder." },
      { q: "Will a gap on my resume hurt me?", a: "Less than it used to. \"Took time off to reset\" is now a sentence recruiters hear weekly." },
      { q: "What do I tell people when I quit without a plan?", a: "\"I'm taking some time to figure out what's next.\" That's it. You don't owe a roadmap." },
    ],
  },
];

export const HUBS_BY_PILLAR: Record<PillarSlug, SituationHub[]> = {
  relationships: HUBS.filter((h) => h.pillar === "relationships"),
  marriage: HUBS.filter((h) => h.pillar === "marriage"),
  family: HUBS.filter((h) => h.pillar === "family"),
  career: HUBS.filter((h) => h.pillar === "career"),
};

export function getHub(slug: string): SituationHub | undefined {
  return HUBS.find((h) => h.slug === slug);
}
