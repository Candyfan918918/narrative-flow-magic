ALTER TABLE public.situations
  ADD COLUMN IF NOT EXISTS scan_signature text,
  ADD COLUMN IF NOT EXISTS scan_read text,
  ADD COLUMN IF NOT EXISTS scan_factors text[] NOT NULL DEFAULT '{}'::text[];