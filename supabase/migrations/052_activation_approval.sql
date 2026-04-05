-- ============================================================
-- 052_activation_approval.sql — Intermediate approval state
-- ============================================================
-- Adds pending_approval + rejected states to onboarding flow.
-- Admin users (platform staff) approve/reject activation requests
-- from the backoffice.

-- 1. Expand stage CHECK constraint
ALTER TABLE onboarding_state DROP CONSTRAINT IF EXISTS onboarding_state_stage_check;
ALTER TABLE onboarding_state ADD CONSTRAINT onboarding_state_stage_check
  CHECK (stage IN ('pending','seeding','demo','pending_approval','activating','active','rejected'));

-- 2. New tracking columns
ALTER TABLE onboarding_state
  ADD COLUMN IF NOT EXISTS approval_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by           UUID REFERENCES admin_users(id),
  ADD COLUMN IF NOT EXISTS rejected_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by           UUID REFERENCES admin_users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason      TEXT;

CREATE INDEX IF NOT EXISTS idx_onboarding_state_pending
  ON onboarding_state(stage) WHERE stage = 'pending_approval';

-- 3. RPC: request activation (client calls from wizard)
CREATE OR REPLACE FUNCTION request_campaign_activation(
  p_tenant_id   UUID,
  p_wizard_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE onboarding_state
     SET stage                 = 'pending_approval',
         wizard_data           = p_wizard_data,
         approval_requested_at = now(),
         rejection_reason      = NULL,
         rejected_at           = NULL,
         rejected_by           = NULL,
         updated_at            = now()
   WHERE tenant_id = p_tenant_id;
END;
$$;

-- 4. RPC: approve activation (admin calls from backoffice)
CREATE OR REPLACE FUNCTION approve_campaign_activation(
  p_tenant_id UUID,
  p_admin_id  UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wizard       JSONB;
  v_candidate    TEXT;
  v_election_type TEXT;
  v_election_date DATE;
  v_name         TEXT;
  v_campaign_id  UUID;
BEGIN
  SELECT wizard_data INTO v_wizard
    FROM onboarding_state
   WHERE tenant_id = p_tenant_id AND stage = 'pending_approval';

  IF v_wizard IS NULL THEN
    RAISE EXCEPTION 'No pending activation found for tenant %', p_tenant_id;
  END IF;

  v_candidate     := v_wizard ->> 'candidateName';
  v_election_type := v_wizard ->> 'electionType';
  v_election_date := NULLIF(v_wizard ->> 'electionDate', '')::date;
  v_name          := 'Campaña ' || COALESCE(v_candidate, '');

  -- Reuse existing RPC to delete demo and create real campaign
  v_campaign_id := activate_real_campaign(
    p_tenant_id,
    v_name,
    v_candidate,
    v_election_type,
    v_election_date
  );

  -- Stamp approval metadata (activate_real_campaign already set stage='active')
  UPDATE onboarding_state
     SET approved_at = now(),
         approved_by = p_admin_id,
         updated_at  = now()
   WHERE tenant_id = p_tenant_id;

  RETURN v_campaign_id;
END;
$$;

-- 5. RPC: reject activation (returns to demo with reason)
CREATE OR REPLACE FUNCTION reject_campaign_activation(
  p_tenant_id UUID,
  p_admin_id  UUID,
  p_reason    TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE onboarding_state
     SET stage            = 'demo',
         rejected_at      = now(),
         rejected_by      = p_admin_id,
         rejection_reason = p_reason,
         updated_at       = now()
   WHERE tenant_id = p_tenant_id AND stage = 'pending_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending activation found for tenant %', p_tenant_id;
  END IF;
END;
$$;
