## What's broken

On a regular (non-scan) room, tapping **share** in `src/components/RoomDetail.tsx` (`shareRoom`) tries three things in order:

1. `window.ShutapShare.manual(...)` — but `installShareEngine()` in `src/lib/share.ts` is never called anywhere, so `window.ShutapShare` is always undefined.
2. `navigator.share(...)` — only exists on mobile browsers; on desktop it's undefined.
3. `navigator.clipboard.writeText(...)` — the fallback, which is what actually runs. This is why the button "only triggers share link" (it silently copies the URL and shows a toast).

Meanwhile the scan card (`ScanShareCard`) and mirror card (`MirrorShareSheet`) both open a proper React modal with the `ShareChannels` chip row (Messages, X, WhatsApp, Instagram, TikTok, copy, native share). We want the room share button to open the same style of sheet.

## Fix

Give rooms a real multi-channel share sheet, matching the scan/mirror pattern, and stop relying on the never-installed `ShutapShare` global.

### Changes

1. **New file: `src/components/RoomShareSheet.tsx`**
   - Portrait-modal styled like `MirrorShareSheet` (dark backdrop, rounded sheet, close on Esc / backdrop click).
   - Header: small eye mark + `shut͏ap` wordmark, room emoji + room title, one italic line "someone in here has lived your exact thing".
   - Editable caption textarea, pre-filled with the same default text the current `shareRoom` builds (`"<title>" — a room on Shutap. someone in here has lived your exact thing → <url>`).
   - `<ShareChannels>` chip row from `src/components/ShareChannels.tsx` — reuse as-is; default channel list already covers native `share`, `sms`, `x`, `whatsapp`, `instagram`, `tiktok`, `copy`.
   - Channel handler mirrors `doPlatform` in `src/lib/share.ts` (X intent URL, `wa.me`, `sms:?&body=`, Instagram/TikTok = copy-then-open, native `navigator.share` when available, copy to clipboard fallback). Show a small "passed on ♥" confirmation after a channel is picked, matching the existing sheets.
   - Bottom row: privacy line "only the headline + link travel, never the full story." + "close" text button.
   - Props: `{ open, onClose, room: { id, emoji, title }, url }`.

2. **`src/components/RoomDetail.tsx`**
   - Add `roomShareOpen` state alongside the existing `scanShareOpen`.
   - Replace the body of `shareRoom`:
     - Keep the `requireRealUser(...)` gate.
     - If `isScan`: keep `setScanShareOpen(true)` (unchanged).
     - Otherwise: `setRoomShareOpen(true)` — no more `ShutapShare`, no more silent clipboard fallback.
   - Mount `<RoomShareSheet open={roomShareOpen} onClose={...} room={{ id, emoji, title }} url={origin + '/room?id=' + room.id} />` next to the existing `<ScanShareCard>` block.
   - Remove the now-unused `window.ShutapShare` branch and the `navigator.share` / clipboard fallback inside `shareRoom`. Keep the separate `offerShare()` companion-driven flow untouched — that one is still gated behind a valence check and is a different UX moment.

### Notes / out of scope

- Not touching `src/lib/share.ts` or the companion-offered "not alone" share (`offerShare`) — those are a different, valence-gated moment; only the manual room share button is broken.
- Not adding a "download image" channel for rooms (rooms don't have a rendered image card like the scan/mirror cards do). Channels list = the 7 default share channels.
- No changes to auth, DB, seed data, or SEO.
