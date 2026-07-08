## Why there's no monthly option

`SubscribePage` (`src/pages/Subscribe.tsx`) already supports both plans — it reads `?plan=monthly` or `?plan=annual` from the URL and defaults to `annual` when the param is missing or invalid:

```ts
const planKey = (search.get('plan') === 'monthly' ? 'monthly' : 'annual')
```

Nothing in the app ever links to `/subscribe?plan=monthly`, and the page renders no toggle, so users always land on annual `$49.99/year` with no way to switch. Both prices exist in code (`mirror_monthly` = `$7.99/month`, `mirror_annual` = `$49.99/year`) and the checkout server fn accepts either.

## Fix

Add an inline **monthly ↔ annual** toggle at the top of the Subscribe page.

### Changes — `src/pages/Subscribe.tsx` only

1. Replace the derived-from-URL `planKey` with local state initialized from the URL param (still defaults to `annual`).
2. Render a two-button pill selector above the summary line:
   - `monthly · $7.99/mo`
   - `annual · $49.99/yr` with a small "save ~48%" note
   - Active button uses the existing pink treatment (`#e7548a`), inactive uses the muted border style already in the file.
3. When the user toggles:
   - update state,
   - update the URL via `navigate('/subscribe?plan=<key>', { replace: true })` so refresh/back preserves choice and existing deep links still work,
   - the `EmbeddedCheckoutProvider` is keyed on `plan.id` so Stripe rebuilds the checkout session with the new price. `fetchClientSecret` already reads the current `plan.id`, so no server-side changes are needed.
4. Hide the toggle when `alreadySubbed` is true (portal path).
5. Keep the existing summary line (`{plan.label} · {plan.price} · 14 days free · founders' pricing`) — it will reflect whichever plan is selected.

### Out of scope

- No changes to `payments.functions.ts`, Stripe products, or webhook handling.
- No pricing changes.
- No changes to how other pages link to `/subscribe` (the default remains annual for existing entry points; users can switch on-page).
