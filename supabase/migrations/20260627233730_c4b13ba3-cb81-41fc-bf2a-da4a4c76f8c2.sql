-- 1. Columns
ALTER TABLE public.situations
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS edited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.situations ADD CONSTRAINT situations_kind_check CHECK (kind IS NULL OR kind IN ('scan','spill'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Enum values
ALTER TYPE situation_status ADD VALUE IF NOT EXISTS 'deleted';
ALTER TYPE situation_status ADD VALUE IF NOT EXISTS 'abandoned';
ALTER TYPE situation_status ADD VALUE IF NOT EXISTS 'open';

-- 3. Policies
DROP POLICY IF EXISTS "owner updates own situation" ON public.situations;
CREATE POLICY "owner updates own situation" ON public.situations FOR UPDATE TO authenticated
  USING (alias_id = auth.uid()) WITH CHECK (alias_id = auth.uid());

DROP POLICY IF EXISTS "owner deletes own situation" ON public.situations;
CREATE POLICY "owner deletes own situation" ON public.situations FOR DELETE TO authenticated
  USING (alias_id = auth.uid());

DROP POLICY IF EXISTS "owner reads own situation" ON public.situations;
CREATE POLICY "owner reads own situation" ON public.situations FOR SELECT TO authenticated
  USING (alias_id = auth.uid());

DROP POLICY IF EXISTS "authenticated reads public non-crisis non-deleted" ON public.situations;
CREATE POLICY "authenticated reads public non-crisis non-deleted" ON public.situations FOR SELECT TO authenticated
  USING (is_public = true AND crisis_flag = false AND status::text != 'deleted');

DROP POLICY IF EXISTS "anon reads public non-crisis" ON public.situations;
DROP POLICY IF EXISTS "anon reads public non-crisis non-deleted" ON public.situations;
CREATE POLICY "anon reads public non-crisis non-deleted" ON public.situations FOR SELECT TO anon
  USING (is_public = true AND crisis_flag = false AND status::text != 'deleted');

-- 4. updated_at trigger on situations
DROP TRIGGER IF EXISTS situations_touch_updated_at ON public.situations;
CREATE TRIGGER situations_touch_updated_at BEFORE UPDATE ON public.situations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  alias_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clean_text text NOT NULL,
  edited boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads non-deleted comments" ON public.comments;
CREATE POLICY "anyone reads non-deleted comments" ON public.comments FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "owner inserts own comment" ON public.comments;
CREATE POLICY "owner inserts own comment" ON public.comments FOR INSERT TO authenticated
  WITH CHECK (alias_id = auth.uid());

DROP POLICY IF EXISTS "owner updates own comment" ON public.comments;
CREATE POLICY "owner updates own comment" ON public.comments FOR UPDATE TO authenticated
  USING (alias_id = auth.uid()) WITH CHECK (alias_id = auth.uid());

DROP POLICY IF EXISTS "owner deletes own comment" ON public.comments;
CREATE POLICY "owner deletes own comment" ON public.comments FOR DELETE TO authenticated
  USING (alias_id = auth.uid());

CREATE INDEX IF NOT EXISTS comments_room_idx ON public.comments (room_id, created_at DESC);

DROP TRIGGER IF EXISTS comments_touch_updated_at ON public.comments;
CREATE TRIGGER comments_touch_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. Aliases: owner-only SELECT
DROP POLICY IF EXISTS "anyone signed-in can read aliases" ON public.aliases;
DROP POLICY IF EXISTS "owner reads own alias" ON public.aliases;
CREATE POLICY "owner reads own alias" ON public.aliases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 7. Public-safe alias accessor (display_name + emoji only)
CREATE OR REPLACE FUNCTION public.alias_public(_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, emoji text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT user_id, display_name, emoji FROM public.aliases WHERE user_id = _user_id; $$;
REVOKE EXECUTE ON FUNCTION public.alias_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.alias_public(uuid) TO anon, authenticated;

-- 8. Lock down internal scheduler
REVOKE EXECUTE ON FUNCTION public.schedule_checkins(uuid, uuid) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.schedule_checkins(uuid, uuid) TO service_role;

-- 9. Cancel-pending helper (uses existing 'suppressed' state)
CREATE OR REPLACE FUNCTION public.cancel_pending_checkins(_situation_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ UPDATE public.checkins SET state = 'suppressed' WHERE situation_id = _situation_id AND state = 'scheduled'; $$;
REVOKE EXECUTE ON FUNCTION public.cancel_pending_checkins(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_pending_checkins(uuid) TO authenticated, service_role;