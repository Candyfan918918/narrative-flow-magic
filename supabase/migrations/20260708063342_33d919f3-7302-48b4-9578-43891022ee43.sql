
-- Drop the previous view-based approach; use column-level privilege revocation instead
DROP VIEW IF EXISTS public.rooms_public;
DROP VIEW IF EXISTS public.comments_public;

-- Restore public SELECT policies (safe columns only remain readable due to column grants below)
DROP POLICY IF EXISTS "rooms owner reads own" ON public.rooms;
CREATE POLICY "rooms readable by anyone" ON public.rooms
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "comments owner reads own" ON public.comments;
CREATE POLICY "anyone reads non-deleted comments" ON public.comments
FOR SELECT TO anon, authenticated
USING (deleted_at IS NULL);

-- ROOMS: hide author_id at the column-privilege level
REVOKE SELECT ON public.rooms FROM anon, authenticated;
GRANT SELECT (
  id, hall, emoji, alias, support, body, title, reflection,
  updated_at, created_at
) ON public.rooms TO anon, authenticated;
-- service_role keeps full access via GRANT ALL (kept intact)
GRANT ALL ON public.rooms TO service_role;

-- COMMENTS: hide alias_id at the column-privilege level
REVOKE SELECT ON public.comments FROM anon, authenticated;
GRANT SELECT (
  id, room_id, clean_text, edited, deleted_at,
  created_at, updated_at
) ON public.comments TO anon, authenticated;
GRANT ALL ON public.comments TO service_role;
