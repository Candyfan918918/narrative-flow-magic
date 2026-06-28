DO $$
DECLARE
  v_secret text := current_setting('app.cron_secret', true);
  v_url text;
BEGIN
  -- unschedule any existing dispatch-checkins jobs and reschedule with the new header
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE command ILIKE '%dispatch-checkins%';
END $$;