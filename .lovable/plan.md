## What the data shows

I measured the actual production site and checked the database:

- **Homepage TTFB: 126ms.** `/welcome`: 63ms. `/about`: 63ms. These are fast.
- **Database is healthy.** Slowest write query averages 3.6ms; slowest read averages 0.5ms. Nothing is choking Postgres.
- **Backend status: healthy.**

So the live site (`shutap.com` / `shutap.lovable.app`) is not slow. The slowness you're feeling is somewhere else.

## What IS slow

The **editor preview iframe** (the panel you're staring at while building) is throwing SSR errors on every request. Server logs show this repeating:

```
Error: h3 swallowed SSR error: {"status":500,"unhandled":true,"message":"HTTPError"}
Error: transport was disconnected, cannot call "fetchModule"
   at async eval (/dev-server/src/router.tsx:6:31)
```

Translation: the in-editor dev server is crashing during server-side render, retrying, and reloading modules. Every navigation in the preview eats that recovery time. This does not affect real users on the published site — only you, in the editor.

## Likely cause

The Vite dev server got into a bad state after recent restarts (`.env.development changed, restarting server...` right before the error burst). The transport dropped mid-request and the server entry can't reload `src/router.tsx` cleanly. This is a preview-runtime issue, not a code bug in the pages themselves.

## Recommended fix (order)

1. **Restart the preview sandbox.** Almost always clears the "transport was disconnected" / stuck-module state. I can do this from build mode.
2. **If it comes back after the restart,** we look for a real cause — most commonly a route file with a top-level throw or a bad import. I'd grep for module-init failures and check `src/router.tsx` + recently-changed route files.
3. **Ignore the "all pages loading slow" symptom on the published site** — the numbers say it isn't real there. If real users are reporting it, tell me and I'll re-measure from a different angle (JS bundle size, LCP, TanStack Query waterfalls).

## What I will NOT do

- No route/page rewrites. The pages are fine.
- No DB indexes or migrations. DB is fine.
- No compute upgrade recommendation. It won't help this.

Approve and I'll restart the preview sandbox and re-check the logs.
