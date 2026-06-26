
-- ============================================================
-- Shutap Agent Specs v2 — Phase A schema
-- Situations canonical model + check-in spine + memory + crisis
-- ============================================================

CREATE TYPE public.situation_pillar AS ENUM ('relationships','marriage','family','career');
CREATE TYPE public.situation_status AS ENUM ('in_progress','resolved','avoided','worse');
CREATE TYPE public.scan_band AS ENUM ('quiet','real','hot','heavy','serious');
CREATE TYPE public.checkin_type AS ENUM ('day0','day1','day2','day3','day7','day14','adaptive30');
CREATE TYPE public.checkin_state AS ENUM ('scheduled','sent','opened','responded','suppressed','snoozed','muted');
CREATE TYPE public.trajectory AS ENUM ('better','same','worse');

-- situations: canonical agent-facing record. clean_text only (Scrubber output).
CREATE TABLE public.situations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pillar public.situation_pillar NOT NULL,
  clean_text text NOT NULL,
  initial_scan int CHECK (initial_scan IS NULL OR (initial_scan >= 0 AND initial_scan <= 999)),
  scan_band public.scan_band,
  reflection text,
  crisis_flag boolean NOT NULL DEFAULT false,
  status public.situation_status NOT NULL DEFAULT 'in_progress',
  tags text[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.situations TO authenticated;
GRANT SELECT ON public.situations TO anon;
GRANT ALL ON public.situations TO service_role;
ALTER TABLE public.situations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads own situations" ON public.situations FOR SELECT TO authenticated
  USING (alias_id = auth.uid() OR (is_public = true AND crisis_flag = false));
CREATE POLICY "anon reads public non-crisis" ON public.situations FOR SELECT TO anon
  USING (is_public = true AND crisis_flag = false);
CREATE POLICY "owner inserts own situation" ON public.situations FOR INSERT TO authenticated
  WITH CHECK (alias_id = auth.uid());
CREATE POLICY "owner updates own situation" ON public.situations FOR UPDATE TO authenticated
  USING (alias_id = auth.uid()) WITH CHECK (alias_id = auth.uid());
CREATE INDEX situations_pillar_public_idx ON public.situations (pillar, is_public, crisis_flag);
CREATE INDEX situations_alias_idx ON public.situations (alias_id, created_at DESC);

-- pii_scrub_log: per-replacement audit, no raw text.
CREATE TABLE public.pii_scrub_log (
  id bigserial PRIMARY KEY,
  situation_id uuid REFERENCES public.situations(id) ON DELETE CASCADE,
  alias_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  detected_type text NOT NULL,
  replacement_token text NOT NULL,
  count int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT, SELECT ON public.pii_scrub_log TO authenticated;
GRANT USAGE ON SEQUENCE public.pii_scrub_log_id_seq TO authenticated;
GRANT ALL ON public.pii_scrub_log TO service_role;
ALTER TABLE public.pii_scrub_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads own scrub log" ON public.pii_scrub_log FOR SELECT TO authenticated
  USING (alias_id = auth.uid());
CREATE POLICY "owner writes own scrub log" ON public.pii_scrub_log FOR INSERT TO authenticated
  WITH CHECK (alias_id = auth.uid());

-- checkins: scheduler state machine per situation.
CREATE TABLE public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  situation_id uuid NOT NULL REFERENCES public.situations(id) ON DELETE CASCADE,
  alias_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.checkin_type NOT NULL,
  scheduled_at timestamptz NOT NULL,
  channel text NOT NULL DEFAULT 'eye',
  state public.checkin_state NOT NULL DEFAULT 'scheduled',
  sent_at timestamptz,
  opened_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (situation_id, type)
);
GRANT SELECT, INSERT, UPDATE ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads own checkins" ON public.checkins FOR SELECT TO authenticated
  USING (alias_id = auth.uid());
CREATE POLICY "owner writes own checkins" ON public.checkins FOR INSERT TO authenticated
  WITH CHECK (alias_id = auth.uid());
CREATE POLICY "owner updates own checkins" ON public.checkins FOR UPDATE TO authenticated
  USING (alias_id = auth.uid()) WITH CHECK (alias_id = auth.uid());
CREATE INDEX checkins_due_idx ON public.checkins (state, scheduled_at);

-- checkin_responses: enum taps + optional scrubbed text.
CREATE TABLE public.checkin_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES public.checkins(id) ON DELETE CASCADE,
  situation_id uuid NOT NULL REFERENCES public.situations(id) ON DELETE CASCADE,
  alias_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rescan int CHECK (rescan IS NULL OR (rescan >= 0 AND rescan <= 999)),
  trajectory public.trajectory,
  resolution public.situation_status,
  would_again text CHECK (would_again IN ('yes','no','na') OR would_again IS NULL),
  clean_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.checkin_responses TO authenticated;
GRANT ALL ON public.checkin_responses TO service_role;
ALTER TABLE public.checkin_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads own responses" ON public.checkin_responses FOR SELECT TO authenticated
  USING (alias_id = auth.uid());
CREATE POLICY "owner writes own responses" ON public.checkin_responses FOR INSERT TO authenticated
  WITH CHECK (alias_id = auth.uid());

-- outcomes: Memory's per-situation structured output.
CREATE TABLE public.outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  situation_id uuid NOT NULL UNIQUE REFERENCES public.situations(id) ON DELETE CASCADE,
  alias_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision_summary text NOT NULL,
  resolution public.situation_status NOT NULL,
  trajectory_curve jsonb NOT NULL DEFAULT '[]'::jsonb,
  would_again text,
  captured_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.outcomes TO authenticated;
GRANT ALL ON public.outcomes TO service_role;
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads own outcomes" ON public.outcomes FOR SELECT TO authenticated
  USING (alias_id = auth.uid());

-- user_patterns: Memory's cross-situation observations.
CREATE TABLE public.user_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger text NOT NULL,
  tendency text NOT NULL,
  what_helps text,
  support int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_patterns TO authenticated;
GRANT ALL ON public.user_patterns TO service_role;
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads own patterns" ON public.user_patterns FOR SELECT TO authenticated
  USING (alias_id = auth.uid());

-- crisis_events: access-controlled; service_role only. Never monetized, never public.
CREATE TABLE public.crisis_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  situation_id uuid REFERENCES public.situations(id) ON DELETE SET NULL,
  category text NOT NULL,
  severity text NOT NULL,
  resources_shown boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.crisis_events TO service_role;
ALTER TABLE public.crisis_events ENABLE ROW LEVEL SECURITY;
-- no policies for anon/authenticated: only service_role bypasses RLS.

-- updated_at triggers
CREATE TRIGGER situations_touch_updated_at BEFORE UPDATE ON public.situations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER user_patterns_touch_updated_at BEFORE UPDATE ON public.user_patterns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
