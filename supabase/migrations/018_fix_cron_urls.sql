-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 018 — Fix cron jobs to call Next.js API routes
--
-- Problem: Migration 017 pointed pg_cron to Supabase Edge Functions
-- (/functions/v1/agent-*) which may not be deployed or configured in production.
-- The Next.js API routes (/api/agents/*) are the correct and maintained
-- implementation — they already support CRON_SECRET authentication.
--
-- Solution: Re-schedule the same 3 cron jobs pointing to the Next.js app URL.
--
-- Requires: Set app.app_url before applying (once per environment):
--   ALTER DATABASE postgres SET "app.app_url" = 'https://app.scrutix.co';
-- ─────────────────────────────────────────────────────────────────────────────

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
    url     := current_setting('app.app_url', true) || '/api/agents/smart-comms',
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
    url     := current_setting('app.app_url', true) || '/api/agents/territory-redistribution',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ── Agent 5 — Campaign Monitor (daily 07:00 UTC) ─────────────────────────

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
    url     := current_setting('app.app_url', true) || '/api/agents/campaign-monitor',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);
