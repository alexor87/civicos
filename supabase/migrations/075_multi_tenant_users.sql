-- 075_multi_tenant_users.sql
-- Foundation for multi-tenant user memberships.
--
-- Goal: A single auth.users can belong to multiple tenants. Membership lives
-- in tenant_users (junction). The "active" tenant for a user is tracked in
-- profiles.active_tenant_id and surfaced in the JWT by the enrich-jwt edge
-- function. Existing RLS policies (~120) keep working unchanged because the
-- JWT still has a single `tenant_id` claim (set to the user's active tenant).
--
-- This migration is idempotent and backward-compatible:
--   • Creates tenant_users table.
--   • Backfills tenant_users from existing profiles (one membership per user).
--   • Adds profiles.active_tenant_id (nullable, defaults to current tenant_id).
--   • Updates handle_new_user() trigger to also create the tenant_users row.
--
-- After this migration:
--   • Existing users continue to behave identically (1 tenant each).
--   • New columns and table are in place to support cross-tenant memberships.
--   • The enrich-jwt edge function (deployed separately) starts publishing
--     tenant_ids[] and active_tenant_id alongside the legacy tenant_id claim.

-- ── 1. tenant_users junction table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenant_users (
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role           public.user_role NOT NULL DEFAULT 'volunteer',
  custom_role_id uuid REFERENCES public.custom_roles(id) ON DELETE SET NULL,
  campaign_ids   uuid[] NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user   ON public.tenant_users(user_id);

ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- A user can always read their own memberships (needed for tenant switcher).
DROP POLICY IF EXISTS "tenant_users_select_own" ON public.tenant_users;
CREATE POLICY "tenant_users_select_own" ON public.tenant_users
  FOR SELECT USING (user_id = auth.uid());

-- Within the active tenant, admins/managers can see all memberships.
DROP POLICY IF EXISTS "tenant_users_select_admin" ON public.tenant_users;
CREATE POLICY "tenant_users_select_admin" ON public.tenant_users
  FOR SELECT USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

-- Only admins/managers of the active tenant can manage memberships.
DROP POLICY IF EXISTS "tenant_users_insert" ON public.tenant_users;
CREATE POLICY "tenant_users_insert" ON public.tenant_users
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

DROP POLICY IF EXISTS "tenant_users_update" ON public.tenant_users;
CREATE POLICY "tenant_users_update" ON public.tenant_users
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

DROP POLICY IF EXISTS "tenant_users_delete" ON public.tenant_users;
CREATE POLICY "tenant_users_delete" ON public.tenant_users
  FOR DELETE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

-- ── 2. Backfill from profiles ─────────────────────────────────────────────────

INSERT INTO public.tenant_users (user_id, tenant_id, role, custom_role_id, campaign_ids, created_at, updated_at)
SELECT
  p.id,
  p.tenant_id,
  p.role,
  p.custom_role_id,
  COALESCE(p.campaign_ids, '{}'::uuid[]),
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- ── 3. Track active tenant per user ──────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.active_tenant_id IS
  'The currently active tenant for this user. Defaults to the legacy tenant_id. Read by enrich-jwt edge function to populate the JWT tenant_id claim.';

-- Default existing users active to their (only) current tenant.
UPDATE public.profiles
SET active_tenant_id = tenant_id
WHERE active_tenant_id IS NULL AND tenant_id IS NOT NULL;

-- ── 4. handle_new_user trigger: also insert into tenant_users ────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_tenant_id uuid := (NEW.raw_user_meta_data->>'tenant_id')::uuid;
  v_role      public.user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'volunteer');
  v_full_name text := NEW.raw_user_meta_data->>'full_name';
  v_campaign_ids uuid[] := COALESCE(
    (
      SELECT array_agg((value::text)::uuid)
      FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'campaign_ids')
    ),
    '{}'::uuid[]
  );
BEGIN
  -- 1) Create the user-level profile (tenant_id kept for backward-compat).
  INSERT INTO public.profiles (id, tenant_id, role, full_name, campaign_ids, active_tenant_id)
  VALUES (NEW.id, v_tenant_id, v_role, v_full_name, v_campaign_ids, v_tenant_id)
  ON CONFLICT (id) DO NOTHING;

  -- 2) Create the membership row in tenant_users.
  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO public.tenant_users (user_id, tenant_id, role, campaign_ids)
    VALUES (NEW.id, v_tenant_id, v_role, v_campaign_ids)
    ON CONFLICT (user_id, tenant_id) DO UPDATE
      SET role         = EXCLUDED.role,
          campaign_ids = EXCLUDED.campaign_ids,
          updated_at   = now();
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger already exists from 001_init.sql; CREATE OR REPLACE FUNCTION above
-- updates its body in place. No need to recreate the trigger.

-- ── 5. Helper: keep tenant_users in sync when a profile is updated ───────────
-- Some legacy code paths still update profiles.role / .campaign_ids. We mirror
-- those into tenant_users for the matching active tenant so behavior is
-- consistent during the transition window.

CREATE OR REPLACE FUNCTION public.fn_sync_profile_to_tenant_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NEW.tenant_id IS NOT NULL THEN
    INSERT INTO public.tenant_users (user_id, tenant_id, role, custom_role_id, campaign_ids)
    VALUES (NEW.id, NEW.tenant_id, NEW.role, NEW.custom_role_id, COALESCE(NEW.campaign_ids, '{}'::uuid[]))
    ON CONFLICT (user_id, tenant_id) DO UPDATE
      SET role          = EXCLUDED.role,
          custom_role_id = EXCLUDED.custom_role_id,
          campaign_ids  = EXCLUDED.campaign_ids,
          updated_at    = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_tenant_user ON public.profiles;
CREATE TRIGGER profiles_sync_tenant_user
  AFTER INSERT OR UPDATE OF role, custom_role_id, campaign_ids, tenant_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_profile_to_tenant_user();
