
-- Revoke SELECT on situations.alias_id from anon/authenticated so pseudonymous auth user id cannot be read via the Data API.
REVOKE SELECT (alias_id) ON public.situations FROM anon;
REVOKE SELECT (alias_id) ON public.situations FROM authenticated;

-- Prevent anonymous (is_anonymous=true) Supabase sessions from touching room_reactions via RLS.
DROP POLICY IF EXISTS "reactions read own" ON public.room_reactions;
DROP POLICY IF EXISTS "reactions insert own" ON public.room_reactions;
DROP POLICY IF EXISTS "reactions delete own" ON public.room_reactions;

CREATE POLICY "reactions read own" ON public.room_reactions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

CREATE POLICY "reactions insert own" ON public.room_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

CREATE POLICY "reactions delete own" ON public.room_reactions
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
