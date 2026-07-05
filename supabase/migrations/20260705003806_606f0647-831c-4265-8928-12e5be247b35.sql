
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_prefs_token text,
  ADD COLUMN IF NOT EXISTS notif_all_opt_out boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notif_checkins_opt_out boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notif_community_opt_out boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notif_digest_opt_out boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_prefs_token_key
  ON public.profiles (email_prefs_token)
  WHERE email_prefs_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_email_lower_idx
  ON public.profiles (lower(email));
