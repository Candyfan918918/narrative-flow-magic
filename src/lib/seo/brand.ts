// Single source of truth for machine-read brand surfaces.
// Keep these strings identical across <title>, meta description base,
// Organization JSON-LD, About page, and llms.txt.

export const BRAND = {
  name: "Shutap",
  tagline: "Shutap. Speak up.",
  // The entity sentence (locked) — goes in every machine-read surface.
  entitySentence:
    "Vent like it's your smartest friend. The easiest way to get it off your chest — type it, spill it, someone always replies. Your real name never shows.",
  // Short variant for title tags.
  entitySentenceShort:
    "Shutap — vent like it's your smartest friend. Type it, spill it, someone always replies.",
} as const;

export const PILLARS = [
  {
    slug: "relationships",
    title: "Relationships",
    blurb:
      "dating, partners, situationships, breakups, the gray area in between.",
  },
  {
    slug: "marriage",
    title: "Marriage",
    blurb: "the long-haul stuff: roommate energy, resentment, repair, leaving, staying.",
  },
  {
    slug: "family",
    title: "Family",
    blurb: "parents, siblings, in-laws, the family group chat, the guilt.",
  },
  {
    slug: "career",
    title: "Career",
    blurb: "work, money, bosses, burnout, the job everyone tells you to be grateful for.",
  },
] as const;
