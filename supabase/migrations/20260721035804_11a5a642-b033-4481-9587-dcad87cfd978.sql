
-- mirror_onboarding: rewrite read policy to exclude anon, add write policies
DROP POLICY IF EXISTS "users read own onboarding" ON public.mirror_onboarding;
CREATE POLICY "owners read own onboarding" ON public.mirror_onboarding
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
CREATE POLICY "owners insert own onboarding" ON public.mirror_onboarding
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
CREATE POLICY "owners update own onboarding" ON public.mirror_onboarding
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners delete own onboarding" ON public.mirror_onboarding
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- outcomes: add owner-scoped writes, excluding anonymous
CREATE POLICY "owner writes own outcomes" ON public.outcomes
  FOR INSERT TO authenticated
  WITH CHECK (alias_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
CREATE POLICY "owner updates own outcomes" ON public.outcomes
  FOR UPDATE TO authenticated
  USING (alias_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK (alias_id = auth.uid());
CREATE POLICY "owner deletes own outcomes" ON public.outcomes
  FOR DELETE TO authenticated
  USING (alias_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- user_patterns: add owner-scoped writes, excluding anonymous
CREATE POLICY "owner writes own patterns" ON public.user_patterns
  FOR INSERT TO authenticated
  WITH CHECK (alias_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
CREATE POLICY "owner updates own patterns" ON public.user_patterns
  FOR UPDATE TO authenticated
  USING (alias_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK (alias_id = auth.uid());
CREATE POLICY "owner deletes own patterns" ON public.user_patterns
  FOR DELETE TO authenticated
  USING (alias_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- billing_emails: explicit no-client-access policy (service-role only)
CREATE POLICY "no client access" ON public.billing_emails
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- crisis_events: explicit no-client-access policy (service-role only)
CREATE POLICY "no client access" ON public.crisis_events
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- pillar_status: allow all signed-in (non-anon) users to read SLA info
CREATE POLICY "pillar_status authenticated read" ON public.pillar_status
  FOR SELECT TO authenticated
  USING (COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
