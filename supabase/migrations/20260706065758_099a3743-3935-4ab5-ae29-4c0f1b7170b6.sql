
CREATE OR REPLACE FUNCTION public.admin_active_users()
RETURNS TABLE(dau bigint, wau bigint, mau bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(DISTINCT e.user_id) FILTER (WHERE e.ts >= now() - interval '1 day')   AS dau,
    count(DISTINCT e.user_id) FILTER (WHERE e.ts >= now() - interval '7 days')  AS wau,
    count(DISTINCT e.user_id) FILTER (WHERE e.ts >= now() - interval '30 days') AS mau
  FROM public.events e
  JOIN public.profiles p ON p.user_id = e.user_id
  WHERE p.is_anonymous = false
    AND e.ts >= now() - interval '30 days';
$$;

CREATE OR REPLACE FUNCTION public.admin_event_counts()
RETURNS TABLE(name text, d7 bigint, d30 bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.name,
         count(*) FILTER (WHERE e.ts >= now() - interval '7 days')  AS d7,
         count(*) FILTER (WHERE e.ts >= now() - interval '30 days') AS d30
  FROM public.events e
  WHERE e.ts >= now() - interval '30 days'
  GROUP BY e.name;
$$;

CREATE OR REPLACE FUNCTION public.admin_country_counts()
RETURNS TABLE(country text, cnt bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.country, count(*) AS cnt
  FROM public.visits v
  WHERE v.started_at >= now() - interval '30 days'
    AND v.country IS NOT NULL
  GROUP BY v.country
  ORDER BY cnt DESC
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION public.admin_provider_counts()
RETURNS TABLE(provider text, cnt bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p.provider, '—') AS provider, count(*) AS cnt
  FROM public.profiles p
  WHERE p.is_anonymous = false
  GROUP BY COALESCE(p.provider, '—');
$$;

REVOKE ALL ON FUNCTION public.admin_active_users()    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_event_counts()    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_country_counts()  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_provider_counts() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_active_users()    TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_event_counts()    TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_country_counts()  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_provider_counts() TO service_role;
