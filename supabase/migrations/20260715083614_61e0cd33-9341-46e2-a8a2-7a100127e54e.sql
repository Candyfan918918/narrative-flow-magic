
-- 1) situations.slug (nullable unique + auto-generator)
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS situations_slug_key ON public.situations (slug) WHERE slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.situations_slugify(_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    trim(both '-' from
      regexp_replace(
        regexp_replace(lower(coalesce(_text, '')), '[^a-z0-9]+', '-', 'g'),
        '-{2,}', '-', 'g'
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.situations_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  suffix text;
BEGIN
  IF NEW.slug IS NOT NULL AND length(NEW.slug) > 0 THEN
    RETURN NEW;
  END IF;

  base := public.situations_slugify(
    coalesce(NEW.title, substring(coalesce(NEW.clean_text, '') from 1 for 80), NEW.id::text)
  );
  IF base IS NULL OR base = '' THEN
    base := 'story';
  END IF;
  -- Trim to first ~8 words / 60 chars
  base := substring(base from 1 for 60);
  base := trim(both '-' from base);

  suffix := substring(replace(NEW.id::text, '-', '') from 1 for 6);
  candidate := base || '-' || suffix;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_situations_set_slug ON public.situations;
CREATE TRIGGER trg_situations_set_slug
  BEFORE INSERT ON public.situations
  FOR EACH ROW
  EXECUTE FUNCTION public.situations_set_slug();

-- Backfill existing rows
UPDATE public.situations
   SET slug = trim(both '-' from
                substring(
                  regexp_replace(
                    regexp_replace(lower(coalesce(title, substring(coalesce(clean_text, '') from 1 for 80), id::text)), '[^a-z0-9]+', '-', 'g'),
                    '-{2,}', '-', 'g'
                  )
                  from 1 for 60
                )
              ) || '-' || substring(replace(id::text, '-', '') from 1 for 6)
 WHERE slug IS NULL;

-- 2) is_seed markers on downstream tables
ALTER TABLE public.mirror_signals  ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;
ALTER TABLE public.mirror_patterns ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;
ALTER TABLE public.outcomes        ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS mirror_signals_is_seed_idx  ON public.mirror_signals  (is_seed) WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS mirror_patterns_is_seed_idx ON public.mirror_patterns (is_seed) WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS outcomes_is_seed_idx        ON public.outcomes        (is_seed) WHERE is_seed = true;
