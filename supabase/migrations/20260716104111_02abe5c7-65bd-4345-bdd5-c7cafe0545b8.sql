CREATE OR REPLACE VIEW public.visits_classified
WITH (security_invoker = true) AS
SELECT
  v.*,
  (
    v.user_id IS NULL
    AND (
      v.user_agent IS NULL
      OR length(btrim(v.user_agent)) = 0
      OR v.user_agent ~* '(bot|crawler|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|w3c_validator|whatsapp|telegram|discordbot|linkedinbot|twitterbot|applebot|yandex|duckduckbot|petalbot|semrush|ahrefs|mj12|dotbot|headlesschrome|phantomjs|puppeteer|playwright|axios|python-requests|curl|wget|node-fetch|go-http-client|httpclient|monitor|uptimerobot|pingdom|gtmetrix|lighthouse|pagespeed|preview)'
    )
  ) AS is_bot
FROM public.visits v;

GRANT SELECT ON public.visits_classified TO authenticated;
GRANT SELECT ON public.visits_classified TO service_role;