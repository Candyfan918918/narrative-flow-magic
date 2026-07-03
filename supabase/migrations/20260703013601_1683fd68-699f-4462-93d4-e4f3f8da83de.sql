
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0;

INSERT INTO public.profiles (
  user_id, email, first_name, last_name, full_name, avatar_url,
  provider, is_anonymous, signup_at, first_visit_at, last_visit_at,
  last_login_at, login_count, visit_count, created_at, updated_at
)
SELECT
  u.id,
  u.email,
  NULLIF(COALESCE(u.raw_user_meta_data->>'given_name', u.raw_user_meta_data->>'first_name'), ''),
  NULLIF(COALESCE(u.raw_user_meta_data->>'family_name', u.raw_user_meta_data->>'last_name'), ''),
  NULLIF(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), ''),
  NULLIF(COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'), ''),
  COALESCE(u.raw_app_meta_data->>'provider', CASE WHEN u.is_anonymous THEN 'anonymous' ELSE 'email' END),
  COALESCE(u.is_anonymous, false),
  u.created_at,
  u.created_at,
  COALESCE(u.last_sign_in_at, u.created_at),
  u.last_sign_in_at,
  CASE WHEN u.last_sign_in_at IS NOT NULL THEN 1 ELSE 0 END,
  0,
  u.created_at,
  now()
FROM auth.users u
ON CONFLICT (user_id) DO UPDATE SET
  email          = COALESCE(public.profiles.email, EXCLUDED.email),
  first_name     = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
  last_name      = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
  full_name      = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
  avatar_url     = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
  provider       = COALESCE(public.profiles.provider, EXCLUDED.provider),
  is_anonymous   = EXCLUDED.is_anonymous,
  signup_at      = COALESCE(public.profiles.signup_at, EXCLUDED.signup_at),
  first_visit_at = LEAST(public.profiles.first_visit_at, EXCLUDED.first_visit_at),
  last_visit_at  = GREATEST(public.profiles.last_visit_at, EXCLUDED.last_visit_at),
  last_login_at  = GREATEST(public.profiles.last_login_at, EXCLUDED.last_login_at),
  login_count    = GREATEST(public.profiles.login_count, EXCLUDED.login_count),
  updated_at     = now();

CREATE INDEX IF NOT EXISTS profiles_last_visit_at_idx ON public.profiles (last_visit_at DESC);
CREATE INDEX IF NOT EXISTS profiles_signup_at_idx ON public.profiles (signup_at DESC);
CREATE INDEX IF NOT EXISTS profiles_is_anonymous_idx ON public.profiles (is_anonymous);
CREATE INDEX IF NOT EXISTS visits_started_at_idx ON public.visits (started_at DESC);
