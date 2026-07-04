
ALTER TABLE public.aliases
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reengagement_email_sent_at timestamptz;

-- Hourly reengagement cron
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reengagement-emails') THEN
    PERFORM cron.unschedule('reengagement-emails');
  END IF;
END $$;

SELECT cron.schedule(
  'reengagement-emails',
  '15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--621a43a7-6958-44da-8f39-411b35fc44de.lovable.app/api/public/hooks/reengagement-emails',
    headers := jsonb_build_object('Content-Type','application/json','apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdWx1cmZ0a2p6amJ5ZHd1eWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMTc5OTIsImV4cCI6MjA5Nzg5Mzk5Mn0.zZs0q9WXV88ttm8wl62z4dOkTjcLkhkuqP8ZzkWazxk'),
    body := '{}'::jsonb
  );
  $$
);
