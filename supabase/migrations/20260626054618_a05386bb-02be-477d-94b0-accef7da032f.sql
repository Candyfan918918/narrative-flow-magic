ALTER TABLE public.aliases
  ADD COLUMN IF NOT EXISTS accepted_terms_version text,
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_privacy_version text,
  ADD COLUMN IF NOT EXISTS accepted_privacy_at timestamptz;