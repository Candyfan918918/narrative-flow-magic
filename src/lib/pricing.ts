// The list prices, in one place.
//
// Every screen that shows a price — /subscribe, /subscribe/return, the joke
// surface's upgrade sheet — reads it from here, so a price change is one edit
// and never drifts between surfaces. Amounts are pre-tax list prices; Stripe
// adds location-based tax inside the embedded checkout.
export const PLAN_TO_PRICE = {
  monthly: { id: 'mirror_monthly', label: 'monthly', amount: 7.99, interval: 'month' as const },
  annual: { id: 'mirror_annual', label: 'annual', amount: 49.99, interval: 'year' as const },
}

export type PlanKey = keyof typeof PLAN_TO_PRICE

export const usd = (n: number) => `$${n.toFixed(2)}`
