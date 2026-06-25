// Confirmed-outcome aggregates surfaced at /what-happens/$slug.
// Gated by §8: a slug only renders an indexable page when it has
// enough confirmed, dated, attributed outcomes (>= MIN_OUTCOMES).
// Until then, the route 404s or renders a noindex empty-state.

import type { PillarSlug } from "./hubs";

export const MIN_OUTCOMES = 12;

export interface OutcomeClaim {
  /** Stable id for the underlying confirmed outcome. */
  id: string;
  /** ISO date of the confirmed outcome. */
  date: string;
  /** Pseudonymous author handle (no PII). */
  by: string;
  /** Short, factual statement of what happened. */
  claim: string;
}

export interface OutcomeAggregate {
  slug: string;
  pillar: PillarSlug;
  /** Verbatim question matching the parent situation hub. */
  question: string;
  /** Headline aggregate, e.g. "of 412 people who left, 71% said they'd do it sooner." */
  headline: string;
  /** Methodology blurb — how aggregation was computed. */
  method: string;
  /** Sample size (confirmed outcomes counted). */
  sampleSize: number;
  /** Last recomputed. */
  updatedAt: string;
  /** Numbered, dated, attributed claims. */
  claims: OutcomeClaim[];
}

// Empty until the Wisdom Graph has seeded outcomes. Phase 3 ships
// the rendering surface; data lands as confirmations accrue.
export const OUTCOMES: OutcomeAggregate[] = [];

export function getOutcome(slug: string): OutcomeAggregate | undefined {
  return OUTCOMES.find((o) => o.slug === slug);
}

export function isOutcomeIndexable(o: OutcomeAggregate | undefined): boolean {
  return !!o && o.claims.length >= MIN_OUTCOMES;
}
