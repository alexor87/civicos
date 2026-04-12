-- ============================================================
-- 058_email_onboarding_sequence.sql
-- Signup onboarding email drip sequence state tracking
-- ============================================================

CREATE TABLE email_sequence_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  step            TEXT NOT NULL CHECK (step IN ('welcome', 'day1', 'day3', 'day7')),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_email_sequence_tenant_step UNIQUE (tenant_id, step)
);

-- Track unsubscribes at the tenant level (one row per tenant)
CREATE TABLE email_sequence_unsubscribes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_email_sequence_unsub_tenant UNIQUE (tenant_id)
);

-- RLS
ALTER TABLE email_sequence_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_sequence_state"
  ON email_sequence_state FOR ALL
  USING (current_setting('role', true) = 'service_role');

CREATE POLICY "Service role full access on email_sequence_unsubscribes"
  ON email_sequence_unsubscribes FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- View: tenants ready for each drip step (used by cron endpoint)
CREATE OR REPLACE VIEW email_sequence_queue AS
WITH registered AS (
  SELECT
    ess.tenant_id,
    ess.user_id,
    ess.email,
    ess.sent_at AS welcome_sent_at
  FROM email_sequence_state ess
  WHERE ess.step = 'welcome'
),
sent_steps AS (
  SELECT tenant_id, array_agg(step) AS steps_sent
  FROM email_sequence_state
  GROUP BY tenant_id
),
unsubbed AS (
  SELECT tenant_id FROM email_sequence_unsubscribes
),
computed AS (
  SELECT
    r.tenant_id,
    r.user_id,
    r.email,
    r.welcome_sent_at,
    COALESCE(ss.steps_sent, ARRAY[]::text[]) AS steps_sent,
    CASE
      WHEN NOT ('day1' = ANY(COALESCE(ss.steps_sent, ARRAY[]::text[])))
           AND now() - r.welcome_sent_at >= interval '1 day'   THEN 'day1'
      WHEN NOT ('day3' = ANY(COALESCE(ss.steps_sent, ARRAY[]::text[])))
           AND ('day1' = ANY(COALESCE(ss.steps_sent, ARRAY[]::text[])))
           AND now() - r.welcome_sent_at >= interval '3 days'  THEN 'day3'
      WHEN NOT ('day7' = ANY(COALESCE(ss.steps_sent, ARRAY[]::text[])))
           AND ('day3' = ANY(COALESCE(ss.steps_sent, ARRAY[]::text[])))
           AND now() - r.welcome_sent_at >= interval '7 days'  THEN 'day7'
      ELSE NULL
    END AS next_step
  FROM registered r
  LEFT JOIN sent_steps ss ON ss.tenant_id = r.tenant_id
  WHERE r.tenant_id NOT IN (SELECT tenant_id FROM unsubbed)
)
SELECT tenant_id, user_id, email, welcome_sent_at, steps_sent, next_step
FROM computed
WHERE next_step IS NOT NULL;
