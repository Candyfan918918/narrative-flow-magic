
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Aliases
CREATE TABLE public.aliases (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion text NOT NULL,
  nation text NOT NULL,
  creature text NOT NULL,
  emoji text NOT NULL,
  display_name text NOT NULL,
  birth_year int NOT NULL,
  birth_month int NOT NULL,
  birth_day int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aliases TO authenticated;
GRANT ALL ON public.aliases TO service_role;
ALTER TABLE public.aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone signed-in can read aliases" ON public.aliases
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own alias" ON public.aliases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own alias" ON public.aliases
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own alias" ON public.aliases
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER aliases_touch_updated_at
  BEFORE UPDATE ON public.aliases
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
