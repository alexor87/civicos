-- ============================================================
-- Migration 053: Auto-cleanup of abandoned demo tenants
--
-- (a) Adds ON DELETE CASCADE to 11 FKs that were missing it, so
--     DELETE FROM tenants safely removes all dependent rows.
-- (b) Creates cleanup_zombie_demo_tenants() which deletes tenants
--     stuck in stage='demo' for >30 days with no recent login.
-- (c) Schedules a weekly pg_cron job (Sundays 03:00 UTC).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- (a) Backfill ON DELETE CASCADE on tenant_id FKs
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'territories',
    'territory_assignments',
    'canvass_scripts',
    'contact_segments',
    'email_campaigns',
    'geo_units',
    'calendar_events',
    'event_participants',
    'event_tasks',
    'calendar_integrations',
    'zone_news_cache'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    -- Only act if table exists (keeps migration idempotent in partial envs)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = v_table) THEN
      EXECUTE format(
        'ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',
        v_table, v_table || '_tenant_id_fkey'
      );
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I
           FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
        v_table, v_table || '_tenant_id_fkey'
      );
    END IF;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- (b) Cleanup function
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_zombie_demo_tenants()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM tenants t
    USING onboarding_state os
    WHERE t.id = os.tenant_id
      AND os.stage = 'demo'
      AND os.demo_started_at < now() - interval '30 days'
      AND NOT EXISTS (
        SELECT 1
        FROM auth.users u
        JOIN profiles p ON p.id = u.id
        WHERE p.tenant_id = t.id
          AND u.last_sign_in_at > now() - interval '7 days'
      )
    RETURNING t.id
  )
  SELECT count(*) INTO v_count FROM deleted;

  RAISE NOTICE 'cleanup_zombie_demo_tenants deleted % tenant(s)', v_count;
  RETURN v_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- (c) Schedule weekly pg_cron job
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('civicos-cleanup-zombie-demos')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'civicos-cleanup-zombie-demos'
  );
END $$;

SELECT cron.schedule(
  'civicos-cleanup-zombie-demos',
  '0 3 * * 0',  -- Sundays at 03:00 UTC
  $$SELECT cleanup_zombie_demo_tenants();$$
);
