-- ============================================================
-- Migration 004: Canvassing v2 — Territorios, scripts, visitas
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabla territories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS territories (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  campaign_id         UUID NOT NULL REFERENCES campaigns(id),
  name                TEXT NOT NULL,
  description         TEXT,
  color               TEXT NOT NULL DEFAULT '#1A6FE8',
  status              TEXT NOT NULL DEFAULT 'disponible',   -- disponible|asignado|en_progreso|completado|archivado
  priority            TEXT NOT NULL DEFAULT 'media',        -- alta|media|baja
  deadline            DATE,
  estimated_contacts  INTEGER NOT NULL DEFAULT 0,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "territories_tenant_isolation" ON territories
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE INDEX IF NOT EXISTS idx_territories_campaign ON territories(campaign_id);
CREATE INDEX IF NOT EXISTS idx_territories_status   ON territories(status);

-- ------------------------------------------------------------
-- 2. Tabla territory_assignments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS territory_assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  territory_id  UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  volunteer_id  UUID NOT NULL REFERENCES profiles(id),
  assigned_by   UUID NOT NULL REFERENCES profiles(id),
  start_date    DATE,
  end_date      DATE,
  status        TEXT NOT NULL DEFAULT 'active',   -- active|completed|cancelled
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE territory_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "territory_assignments_tenant_isolation" ON territory_assignments
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE INDEX IF NOT EXISTS idx_territory_assignments_territory ON territory_assignments(territory_id);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_volunteer ON territory_assignments(volunteer_id);

-- ------------------------------------------------------------
-- 3. Tabla canvass_scripts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS canvass_scripts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  name        TEXT NOT NULL,
  description TEXT,
  questions   JSONB NOT NULL DEFAULT '[]',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  version     INTEGER NOT NULL DEFAULT 1,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE canvass_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "canvass_scripts_tenant_isolation" ON canvass_scripts
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE INDEX IF NOT EXISTS idx_canvass_scripts_campaign ON canvass_scripts(campaign_id);

-- ------------------------------------------------------------
-- 4. Ampliar canvass_visits
-- ------------------------------------------------------------

-- Nuevos valores para el enum visit_result
-- (los valores originales: positive, negative, undecided, no_home, follow_up, refused se mantienen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'contacted' AND enumtypid = 'visit_result'::regtype) THEN
    ALTER TYPE visit_result ADD VALUE 'contacted';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'not_home' AND enumtypid = 'visit_result'::regtype) THEN
    ALTER TYPE visit_result ADD VALUE 'not_home';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'neighbor_absent' AND enumtypid = 'visit_result'::regtype) THEN
    ALTER TYPE visit_result ADD VALUE 'neighbor_absent';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'moved' AND enumtypid = 'visit_result'::regtype) THEN
    ALTER TYPE visit_result ADD VALUE 'moved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'wrong_address' AND enumtypid = 'visit_result'::regtype) THEN
    ALTER TYPE visit_result ADD VALUE 'wrong_address';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'deceased' AND enumtypid = 'visit_result'::regtype) THEN
    ALTER TYPE visit_result ADD VALUE 'deceased';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'come_back_later' AND enumtypid = 'visit_result'::regtype) THEN
    ALTER TYPE visit_result ADD VALUE 'come_back_later';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'inaccessible' AND enumtypid = 'visit_result'::regtype) THEN
    ALTER TYPE visit_result ADD VALUE 'inaccessible';
  END IF;
END $$;

-- Nuevas columnas en canvass_visits
ALTER TABLE canvass_visits
  ADD COLUMN IF NOT EXISTS territory_id       UUID REFERENCES territories(id),
  ADD COLUMN IF NOT EXISTS attempt_number     INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sympathy_level     SMALLINT CHECK (sympathy_level IS NULL OR (sympathy_level BETWEEN 1 AND 5)),
  ADD COLUMN IF NOT EXISTS vote_intention     TEXT,
  ADD COLUMN IF NOT EXISTS persuadability     TEXT,
  ADD COLUMN IF NOT EXISTS script_id          UUID REFERENCES canvass_scripts(id),
  ADD COLUMN IF NOT EXISTS script_responses   JSONB,
  ADD COLUMN IF NOT EXISTS script_completed   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_to_volunteer BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_to_donate    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_more_info    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_yard_sign    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requested_followup BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS followup_channel   TEXT,
  ADD COLUMN IF NOT EXISTS followup_notes     TEXT,
  ADD COLUMN IF NOT EXISTS best_contact_time  TEXT,
  ADD COLUMN IF NOT EXISTS household_size     SMALLINT,
  ADD COLUMN IF NOT EXISTS household_voters   SMALLINT,
  ADD COLUMN IF NOT EXISTS new_contacts_found JSONB,
  ADD COLUMN IF NOT EXISTS address_confirmed  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS address_notes      TEXT,
  ADD COLUMN IF NOT EXISTS was_offline        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status             TEXT NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS rejection_reason   TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by        UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at        TIMESTAMPTZ;

-- Índice adicional para territory_id y status
CREATE INDEX IF NOT EXISTS idx_canvass_visits_territory ON canvass_visits(territory_id);
CREATE INDEX IF NOT EXISTS idx_canvass_visits_status    ON canvass_visits(status);
