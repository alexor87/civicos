-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 009 — Analytics Engine (pg_cron + pg_net)
-- Enables scheduled proactive analysis that calls the analytics-engine
-- Edge Function every morning at 8 AM UTC.
--
-- NOTE: pg_cron and pg_net must be enabled in the Supabase dashboard under
-- Database → Extensions before applying this migration.
-- The SUPABASE_URL and CRON_SECRET values must be set as DB secrets or
-- replaced at migration time.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable extensions (no-op if already enabled via dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Scheduled job ─────────────────────────────────────────────────────────────
-- Runs daily at 08:00 UTC.
-- Replace <SUPABASE_URL> and <CRON_SECRET> with your actual values,
-- or manage via Supabase secrets + a wrapper SQL function.

DO $$
BEGIN
  -- Remove existing schedule if present (idempotent)
  PERFORM cron.unschedule('civicos-analytics')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'civicos-analytics'
  );
END $$;

-- The job calls the analytics-engine Edge Function via HTTP POST.
-- In production, replace the URL and secret with environment-aware values.
SELECT cron.schedule(
  'civicos-analytics',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.analytics_engine_url', true),
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'x-cron-secret',  current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ── App settings (set via Supabase dashboard → Database → Config or CLI) ─────
-- These are placeholders. Set the real values with:
--   ALTER DATABASE postgres SET "app.analytics_engine_url" = 'https://...';
--   ALTER DATABASE postgres SET "app.cron_secret" = 'your-secret';
-- ─────────────────────────────────────────────────────────────────────────────
