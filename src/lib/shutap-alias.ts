// Shutap alias ceremony — emotion × nation × creature → persistent pseudonym.
// Kept in plain TS so it can run on the server (seed) and the client (Welcome).

export const EMOTIONS = [
  "Quiet", "Defiant", "Mortified", "Patient", "Wistful", "Tender",
  "Hopeful", "Stubborn", "Gentle", "Restless", "Curious", "Bruised",
  "Brave", "Watchful", "Earnest", "Soft-spoken", "Sleepless", "Honest",
] as const;

export const NATIONS = [
  "Nigerian", "Kenyan", "Polish", "Indian", "Ethiopian", "Brazilian",
  "Korean", "Greek", "Argentine", "Lebanese", "Indonesian", "Filipino",
  "Mexican", "Portuguese", "Egyptian", "Vietnamese", "Irish", "Moroccan",
] as const;

export const CREATURES: { name: string; emoji: string }[] = [
  { name: "Swan", emoji: "🦢" },
  { name: "Lion", emoji: "🦁" },
  { name: "Hedgehog", emoji: "🦔" },
  { name: "Dove", emoji: "🕊" },
  { name: "Butterfly", emoji: "🦋" },
  { name: "Hare", emoji: "🐇" },
  { name: "Owl", emoji: "🦉" },
  { name: "Fox", emoji: "🦊" },
  { name: "Crane", emoji: "🦩" },
  { name: "Otter", emoji: "🦦" },
  { name: "Wolf", emoji: "🐺" },
  { name: "Deer", emoji: "🦌" },
  { name: "Bear", emoji: "🐻" },
  { name: "Heron", emoji: "🪿" },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export type Alias = {
  emotion: string;
  nation: string;
  creature: string;
  emoji: string;
  display_name: string;
};

export function rollAlias(): Alias {
  const emotion = pick(EMOTIONS);
  const nation = pick(NATIONS);
  const creature = pick(CREATURES);
  return {
    emotion,
    nation,
    creature: creature.name,
    emoji: creature.emoji,
    display_name: `${emotion} ${nation} ${creature.name}`,
  };
}

/** Latest birthday that still counts as 18+ today. */
export function eighteenYearBoundary(now = new Date()) {
  return new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
}

export function isAdult(year: number, month: number, day: number, now = new Date()) {
  const dob = new Date(year, month - 1, day);
  return dob <= eighteenYearBoundary(now);
}
