-- Tighten room_relates policies: exclude anonymous auth sessions.
DROP POLICY IF EXISTS "relates read own" ON public.room_relates;
DROP POLICY IF EXISTS "relates delete own" ON public.room_relates;
DROP POLICY IF EXISTS "relates insert own" ON public.room_relates;

CREATE POLICY "relates read own" ON public.room_relates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

CREATE POLICY "relates insert own" ON public.room_relates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

CREATE POLICY "relates delete own" ON public.room_relates
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

-- Revoke pseudonymity-breaking alias_id column read access from clients.
-- Server code that needs alias_id uses the service-role client (supabaseAdmin).
REVOKE SELECT (alias_id) ON public.situations FROM anon;
REVOKE SELECT (alias_id) ON public.situations FROM authenticated;