// Halls = curated collection pages at /halls/$hall/$region/$window.
// Each hall is a leaderboard view over confirmed outcomes / room signal.
// Indexability is gated on a minimum population per (hall, region, window).

export const HALLS = {
  "most-related": {
    title: "most-related",
    blurb: "rooms the most people said 'same' to.",
  },
  "longest-thread": {
    title: "longest-thread",
    blurb: "the rooms that wouldn't stop unfolding.",
  },
  "best-outcomes": {
    title: "best-outcomes",
    blurb: "what people said they're glad they did.",
  },
} as const;

export type HallSlug = keyof typeof HALLS;

export const REGIONS = ["global", "us", "uk", "eu", "ca", "au"] as const;
export type Region = (typeof REGIONS)[number];

export const WINDOWS = ["7d", "30d", "90d", "all-time"] as const;
export type Window = (typeof WINDOWS)[number];

export const MIN_HALL_ENTRIES = 20;

export interface HallEntry {
  id: string;
  title: string;
  href: string;
  /** e.g. "same: 412" or "outcomes: 88". */
  metric: string;
}

export interface HallView {
  hall: HallSlug;
  region: Region;
  window: Window;
  entries: HallEntry[];
  updatedAt: string;
}

// Empty until the data pipeline seeds confirmed signal. Routes still
// render the shell and emit noindex while populations are below threshold.
export function getHallView(
  hall: HallSlug,
  region: Region,
  window: Window,
): HallView | undefined {
  void hall;
  void region;
  void window;
  return undefined;
}

export function isValidHall(s: string): s is HallSlug {
  return s in HALLS;
}
export function isValidRegion(s: string): s is Region {
  return (REGIONS as readonly string[]).includes(s);
}
export function isValidWindow(s: string): s is Window {
  return (WINDOWS as readonly string[]).includes(s);
}
