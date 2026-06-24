CREATE TABLE public.mirror_onboarding (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarded_at timestamptz NOT NULL DEFAULT now(),
  welcome_email_sent_at timestamptz,
  source text NOT NULL DEFAULT 'subscription',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mirror_onboarding TO authenticated;
GRANT ALL ON public.mirror_onboarding TO service_role;

ALTER TABLE public.mirror_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own onboarding"
  ON public.mirror_onboarding FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER mirror_onboarding_touch_updated_at
  BEFORE UPDATE ON public.mirror_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();