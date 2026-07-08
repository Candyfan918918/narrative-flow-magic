## Why your new room doesn't show up on `/stream`

`/stream` currently reads from only two places:

1. **Seed rooms** hardcoded in `SHUTAP_SEED` (`src/data/seed.ts`)
2. **Your device's `localStorage`** key `shutap_user_situations`

It never queries the `rooms` table in the database. So:

- On the device where you spilled, the room shows because `SpillModal.publishOrSave` calls `appendUserRoom(...)` after save, which writes to `localStorage`. After sign-out or on a different browser/device, that cache is gone and the room disappears from Stream even though the DB row still exists.
- Rooms other real users spill never show up for you at all.
- If you spill and are bounced through `/welcome` (anonymous session), the resume-after-sign-in path in `HomePage.tsx` does append to `localStorage`, but again only on that device.

Meanwhile `rooms` table SELECT is public (`anon, authenticated`, safe columns only: `id, hall, emoji, alias, support, body, title, reflection, created_at, updated_at`), so we can just fetch it.

## Fix

Make `/stream` actually read the `rooms` table.

### Changes

1. **`src/pages/Stream.tsx`** — add a client-side fetch of public rooms and merge into the feed.
   - New `useEffect` (post-mount) that runs `supabase.from('rooms').select('id, alias, emoji, title, body, support, hall, created_at, updated_at').order('created_at', { ascending: false }).limit(200)`.
   - Map DB rows to `RoomTileData` (fill defaults for missing fields: `reflection: ''`, `hours: relativeTime(created_at)`, `relates: 0`, `sitting: 1`, `reactions: {heard:0,same:0,strong:0,time:0,brave:0}`, `kind: 'spill'`, `pillar: null`).
   - Merge order in `rooms` memo: `dbRooms` (newest first) → `localUserRooms` (device fallback, deduped) → `seed`. Dedup by `id` so a just-published room shown from `appendUserRoom` isn't listed twice when the DB fetch resolves.
   - Re-fetch when the `shutap_user_situations` storage event fires (already listened for) so a fresh publish triggers a refresh on the same tab.
   - Optional: subscribe to `postgres_changes` on `public.rooms` inside the same `useEffect` for live inserts; tear the channel down on unmount.

2. **Deep link keeps working** — `/stream#room-<id>` still resolves because the DB fetch will now include the new room.

No changes to the write path, RLS, or `rooms` table schema — the row already exists after `saveSituation`; we just weren't reading it.

### Out of scope

- Reactions/relates counts on DB rooms (columns don't exist in the table selection; they stay at 0 until we wire the aggregate).
- Realtime is optional; if you'd rather keep this minimal, we can skip the channel and rely on the mount fetch + storage event.
