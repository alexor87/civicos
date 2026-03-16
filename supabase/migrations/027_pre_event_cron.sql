-- ============================================================
-- Migration 027: Cron para briefings pre-evento automáticos
-- Trigger: cada 30 minutos
-- Edge Function: send-pre-event-briefings
-- Precondition: extensions pg_cron y pg_net ya habilitadas (migration 009)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('civicos-pre-event-briefings')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'civicos-pre-event-briefings');
END $$;

-- Schedule: every 30 minutes
SELECT cron.schedule(
  'civicos-pre-event-briefings',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url', true) || '/functions/v1/send-pre-event-briefings',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);
