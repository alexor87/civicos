-- Journey Runner cron job
-- Calls the `journey-runner` Edge Function every minute to process due enrollments.
-- Requires: pg_cron and pg_net extensions (enabled by default on Supabase).

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove old job if it exists (idempotent)
SELECT cron.unschedule('journey-runner') FROM cron.job WHERE jobname = 'journey-runner';

-- Schedule: every minute
SELECT cron.schedule(
  'journey-runner',
  '* * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://hugufyyhiiqwbxvxbinm.supabase.co/functions/v1/journey-runner',
      headers := '{"Content-Type":"application/json","x-cron-secret":"civicos-cron-2024"}'::jsonb,
      body    := '{}'::jsonb
    ) AS request_id;
  $$
);
