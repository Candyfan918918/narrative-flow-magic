
-- ============================================================
-- 1) Rooms write policies: exclude anonymous sign-ins
-- ============================================================
DROP POLICY IF EXISTS "rooms delete own" ON public.rooms;
DROP POLICY IF EXISTS "rooms update own" ON public.rooms;
DROP POLICY IF EXISTS "rooms insert own" ON public.rooms;

CREATE POLICY "rooms delete own" ON public.rooms
FOR DELETE TO authenticated
USING (
  auth.uid() = author_id
  AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
);

CREATE POLICY "rooms update own" ON public.rooms
FOR UPDATE TO authenticated
USING (
  auth.uid() = author_id
  AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
)
WITH CHECK (
  auth.uid() = author_id
  AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
);

CREATE POLICY "rooms insert own" ON public.rooms
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
);

-- ============================================================
-- 2) Hide rooms.author_id from public reads
--    - Restrict base-table SELECT to the row's owner
--    - Expose safe columns via SECURITY DEFINER-style view
-- ============================================================
DROP POLICY IF EXISTS "rooms readable by anyone" ON public.rooms;

CREATE POLICY "rooms owner reads own" ON public.rooms
FOR SELECT TO authenticated
USING (auth.uid() = author_id);

CREATE OR REPLACE VIEW public.rooms_public
WITH (security_invoker = false) AS
SELECT
  id, hall, emoji, alias, support, body, title, reflection,
  updated_at, created_at
FROM public.rooms;

REVOKE ALL ON public.rooms_public FROM PUBLIC;
GRANT SELECT ON public.rooms_public TO anon, authenticated;

-- ============================================================
-- 3) Hide comments.alias_id from public reads
-- ============================================================
DROP POLICY IF EXISTS "anyone reads non-deleted comments" ON public.comments;

CREATE POLICY "comments owner reads own" ON public.comments
FOR SELECT TO authenticated
USING (auth.uid() = alias_id);

CREATE OR REPLACE VIEW public.comments_public
WITH (security_invoker = false) AS
SELECT
  id, room_id, clean_text, edited,
  created_at, updated_at
FROM public.comments
WHERE deleted_at IS NULL;

REVOKE ALL ON public.comments_public FROM PUBLIC;
GRANT SELECT ON public.comments_public TO anon, authenticated;
