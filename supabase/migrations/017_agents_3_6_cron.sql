-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 017 — pg_cron schedules for Agents 3, 4, and 5
--
-- Agent 3 (agent-smart-comms):    daily at 10:00 UTC
-- Agent 4 (agent-territory-redistribution): nightly at 02:00 UTC
-- Agent 5 (agent-campaign-monitor): daily at 07:00 UTC
--
-- Agent 6 (agent-content-gen) is UI-triggered via HTTP — no cron needed.
--
-- Requires: pg_cron and pg_net extensions (already enabled by migration 009).
-- Set app settings before applying:
--   ALTER DATABASE postgres SET "app.supabase_url" = 'https://<ref>.supabase.co';
--   ALTER DATABASE postgres SET "app.cron_secret" = 'your-cron-secret';
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Agent 3 — Smart Communications (daily 10:00 UTC) ──────────────────────

DO $$
BEGIN
  PERFORM cron.unschedule('civicos-agent-smart-comms')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'civicos-agent-smart-comms');
END $$;

SELECT cron.schedule(
  'civicos-agent-smart-comms',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url', true) || '/functions/v1/agent-smart-comms',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ── Agent 4 — Territory Redistribution (nightly 02:00 UTC) ───────────────

DO $$
BEGIN
  PERFORM cron.unschedule('civicos-agent-territory-redistribution')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'civicos-agent-territory-redistribution');
END $$;

SELECT cron.schedule(
  'civicos-agent-territory-redistribution',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url', true) || '/functions/v1/agent-territory-redistribution',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ── Agent 5 — Campaign Monitor (daily 07:00 UTC) ──────────────────────────

DO $$
BEGIN
  PERFORM cron.unschedule('civicos-agent-campaign-monitor')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'civicos-agent-campaign-monitor');
END $$;

SELECT cron.schedule(
  'civicos-agent-campaign-monitor',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url', true) || '/functions/v1/agent-campaign-monitor',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);
