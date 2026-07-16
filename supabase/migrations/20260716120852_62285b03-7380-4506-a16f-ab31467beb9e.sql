DROP VIEW IF EXISTS public.visits_classified;
CREATE VIEW public.visits_classified AS
SELECT
  id, user_id, session_id, started_at, path, referrer, user_agent, country, city, is_revisit,
  utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_path,
  (user_id IS NULL AND (user_agent IS NULL OR length(btrim(user_agent)) = 0 OR user_agent ~* '(bot|crawler|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|w3c_validator|whatsapp|telegram|discordbot|linkedinbot|twitterbot|applebot|yandex|duckduckbot|petalbot|semrush|ahrefs|mj12|dotbot|headlesschrome|phantomjs|puppeteer|playwright|axios|python-requests|curl|wget|node-fetch|go-http-client|httpclient|monitor|uptimerobot|pingdom|gtmetrix|lighthouse|pagespeed|preview)'::text)) AS is_bot
FROM public.visits v;

GRANT SELECT ON public.visits_classified TO authenticated;
GRANT ALL ON public.visits_classified TO service_role;