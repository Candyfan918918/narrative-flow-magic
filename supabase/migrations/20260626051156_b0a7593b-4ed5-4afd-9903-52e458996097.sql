
-- Phase C scheduler additions
ALTER TABLE public.aliases
  ADD COLUMN IF NOT EXISTS notif_email text,
  ADD COLUMN IF NOT EXISTS notif_email_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_suppressed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

ALTER TABLE public.checkin_responses
  ADD COLUMN IF NOT EXISTS action text,
  ADD COLUMN IF NOT EXISTS feeling_tap text;

-- track delivery channel state per situation
ALTER TABLE public.situations
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Schedule the day0..day14 cadence for a freshly spilled situation
CREATE OR REPLACE FUNCTION public.schedule_checkins(p_situation_id uuid, p_alias_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base timestamptz := now();
  t record;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('day0'::checkin_type,  interval '0 minutes', 'eye'),
      ('day1'::checkin_type,  interval '1 day',    'email'),
      ('day2'::checkin_type,  interval '2 days',   'email'),
      ('day3'::checkin_type,  interval '3 days',   'email'),
      ('day7'::checkin_type,  interval '7 days',   'email'),
      ('day14'::checkin_type, interval '14 days',  'email')
    ) AS x(typ, offs, ch)
  LOOP
    INSERT INTO public.checkins (situation_id, alias_id, type, scheduled_at, channel, state)
    VALUES (p_situation_id, p_alias_id, t.typ, base + t.offs, t.ch, 'scheduled')
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.schedule_checkins(uuid, uuid) TO authenticated, service_role;

-- Drive an outcome at day14 from a structured response
CREATE OR REPLACE FUNCTION public.derive_outcome_from_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ck record;
BEGIN
  SELECT * INTO ck FROM public.checkins WHERE id = NEW.checkin_id;
  IF ck.type = 'day14' AND NEW.resolution IS NOT NULL THEN
    INSERT INTO public.outcomes (situation_id, alias_id, decision_summary, resolution, would_again)
    VALUES (ck.situation_id, NEW.alias_id, COALESCE(NEW.clean_text, ''), NEW.resolution, NEW.would_again)
    ON CONFLICT DO NOTHING;
    UPDATE public.situations
       SET status = CASE NEW.resolution::text
                      WHEN 'resolved' THEN 'resolved'::situation_status
                      WHEN 'avoided'  THEN 'avoided'::situation_status
                      WHEN 'worse'    THEN 'worse'::situation_status
                      ELSE status END,
           resolved_at = CASE WHEN NEW.resolution::text IN ('resolved','avoided','worse') THEN now() ELSE resolved_at END
     WHERE id = ck.situation_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_derive_outcome ON public.checkin_responses;
CREATE TRIGGER trg_derive_outcome
AFTER INSERT ON public.checkin_responses
FOR EACH ROW EXECUTE FUNCTION public.derive_outcome_from_response();
