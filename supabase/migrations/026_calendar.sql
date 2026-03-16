-- ============================================================
-- Migration 026: Calendario Electoral Inteligente — Fase 1
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. calendar_events
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  campaign_id           UUID NOT NULL REFERENCES campaigns(id),
  created_by            UUID REFERENCES profiles(id),

  -- Básicos
  title                 TEXT NOT NULL,
  event_type            TEXT NOT NULL DEFAULT 'internal_meeting',
    -- public_event | internal_meeting | media_debate | canvassing |
    -- fundraising | electoral_date | institutional_visit | media_session | personal_time
  status                TEXT NOT NULL DEFAULT 'confirmed',
    -- confirmed | cancelled | completed
  all_day               BOOLEAN NOT NULL DEFAULT false,
  start_at              TIMESTAMPTZ NOT NULL,
  end_at                TIMESTAMPTZ NOT NULL,

  -- Ubicación
  location_text         TEXT,
  municipality_code     TEXT,          -- código DANE o similar
  municipality_name     TEXT,
  neighborhood_name     TEXT,

  -- Contenido
  description           TEXT,
  internal_notes        TEXT,
  expected_attendance   INTEGER,
  actual_attendance     INTEGER,

  -- Post-evento
  post_event_notes      TEXT,
  post_event_rating     INTEGER CHECK (post_event_rating BETWEEN 1 AND 5),
  completed_at          TIMESTAMPTZ,

  -- Cancelación
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,

  -- Inteligencia IA
  intelligence_status   TEXT NOT NULL DEFAULT 'pending',
    -- pending | generating | ready | error
  intelligence_updated_at TIMESTAMPTZ,
  ai_briefing           JSONB,         -- {summary, audience, risks, talking_points, logistics}
  briefing_sent         BOOLEAN NOT NULL DEFAULT false,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_tenant_isolation" ON calendar_events
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE INDEX IF NOT EXISTS idx_calendar_events_campaign    ON calendar_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at    ON calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status      ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type  ON calendar_events(event_type);

-- ─────────────────────────────────────────────────────────────
-- 2. event_participants
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_participants (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  event_id     UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  profile_id   UUID REFERENCES profiles(id),
  name         TEXT,                  -- Para externos sin perfil
  email        TEXT,
  role         TEXT NOT NULL DEFAULT 'attendee',   -- organizer | attendee | speaker
  status       TEXT NOT NULL DEFAULT 'invited',    -- invited | confirmed | declined
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_tenant_isolation" ON event_participants
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE INDEX IF NOT EXISTS idx_event_participants_event   ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_profile ON event_participants(profile_id);

-- ─────────────────────────────────────────────────────────────
-- 3. event_tasks
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  event_id     UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  assigned_to  UUID REFERENCES profiles(id),
  title        TEXT NOT NULL,
  due_at       TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending | done
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_tasks_tenant_isolation" ON event_tasks
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE INDEX IF NOT EXISTS idx_event_tasks_event ON event_tasks(event_id);

-- ─────────────────────────────────────────────────────────────
-- 4. calendar_integrations  (Fase 2: Google Calendar, iCal)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  campaign_id    UUID NOT NULL REFERENCES campaigns(id),
  profile_id     UUID NOT NULL REFERENCES profiles(id),
  provider       TEXT NOT NULL DEFAULT 'google',   -- google | ical | outlook
  access_token   TEXT,
  refresh_token  TEXT,
  token_expiry   TIMESTAMPTZ,
  calendar_id    TEXT,
  sync_enabled   BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_integrations_tenant_isolation" ON calendar_integrations
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

-- ─────────────────────────────────────────────────────────────
-- 5. zone_news_cache  (Fase 2: integración de noticias)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zone_news_cache (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  municipality_code TEXT NOT NULL,
  neighborhood_name TEXT,
  news_items        JSONB NOT NULL DEFAULT '[]',
  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (municipality_code, neighborhood_name)
);

ALTER TABLE zone_news_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zone_news_cache_tenant_isolation" ON zone_news_cache
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

-- ─────────────────────────────────────────────────────────────
-- Seed: 9 eventos demo para campaña Rionegro
-- campaign_id: 37f9b055-d6de-465c-8369-196f4bc018af
-- tenant_id: de5cf8ce-1534-4c11-88d1-83d98d9f5c31  (leer de la tabla para evitar hardcode)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_campaign_id UUID := '37f9b055-d6de-465c-8369-196f4bc018af';
  v_tenant_id   UUID;
  v_now         TIMESTAMPTZ := now();
BEGIN
  -- Obtener tenant_id de la campaña
  SELECT tenant_id INTO v_tenant_id FROM campaigns WHERE id = v_campaign_id;
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'Campaign % not found — skipping seed', v_campaign_id;
    RETURN;
  END IF;

  INSERT INTO calendar_events (
    tenant_id, campaign_id, title, event_type, status,
    start_at, end_at, location_text, municipality_name,
    neighborhood_name, expected_attendance, intelligence_status
  ) VALUES
  -- 1. Mitin público
  (v_tenant_id, v_campaign_id,
   'Gran Mitin Plaza Central',
   'public_event', 'confirmed',
   v_now + INTERVAL '3 days', v_now + INTERVAL '3 days' + INTERVAL '3 hours',
   'Plaza Central de Rionegro', 'Rionegro', 'Centro', 500, 'pending'),

  -- 2. Reunión interna
  (v_tenant_id, v_campaign_id,
   'Reunión Semanal de Coordinadores',
   'internal_meeting', 'confirmed',
   v_now + INTERVAL '1 day', v_now + INTERVAL '1 day' + INTERVAL '2 hours',
   'Sede de Campaña', 'Rionegro', NULL, 20, 'pending'),

  -- 3. Debate en medios
  (v_tenant_id, v_campaign_id,
   'Debate Electoral Canal Local',
   'media_debate', 'confirmed',
   v_now + INTERVAL '7 days', v_now + INTERVAL '7 days' + INTERVAL '2 hours',
   'Canal Local Rionegro TV', 'Rionegro', NULL, 0, 'pending'),

  -- 4. Canvassing
  (v_tenant_id, v_campaign_id,
   'Canvassing Barrio El Porvenir',
   'canvassing', 'confirmed',
   v_now + INTERVAL '2 days', v_now + INTERVAL '2 days' + INTERVAL '4 hours',
   'Barrio El Porvenir', 'Rionegro', 'El Porvenir', 30, 'pending'),

  -- 5. Recaudación de fondos
  (v_tenant_id, v_campaign_id,
   'Cena de Recaudación — Empresarios Locales',
   'fundraising', 'confirmed',
   v_now + INTERVAL '10 days', v_now + INTERVAL '10 days' + INTERVAL '3 hours',
   'Club Campestre Rionegro', 'Rionegro', NULL, 80, 'pending'),

  -- 6. Fecha electoral
  (v_tenant_id, v_campaign_id,
   'Elecciones Municipales 2026',
   'electoral_date', 'confirmed',
   v_now + INTERVAL '25 days', v_now + INTERVAL '25 days' + INTERVAL '12 hours',
   'Puestos de Votación — Municipio de Rionegro', 'Rionegro', NULL, 0, 'pending'),

  -- 7. Visita institucional
  (v_tenant_id, v_campaign_id,
   'Visita a la Alcaldía Municipal',
   'institutional_visit', 'confirmed',
   v_now + INTERVAL '5 days', v_now + INTERVAL '5 days' + INTERVAL '1 hour',
   'Alcaldía de Rionegro', 'Rionegro', 'Centro', 5, 'pending'),

  -- 8. Sesión de medios
  (v_tenant_id, v_campaign_id,
   'Sesión de Fotos — Material de Campaña',
   'media_session', 'confirmed',
   v_now + INTERVAL '4 days', v_now + INTERVAL '4 days' + INTERVAL '2 hours',
   'Estudio Fotográfico Centro', 'Rionegro', NULL, 10, 'pending'),

  -- 9. Canvassing zona norte
  (v_tenant_id, v_campaign_id,
   'Canvassing Zona Norte — Operativo Masivo',
   'canvassing', 'confirmed',
   v_now + INTERVAL '8 days', v_now + INTERVAL '8 days' + INTERVAL '5 hours',
   'Zona Norte Rionegro', 'Rionegro', 'Zona Norte', 50, 'pending');

  RAISE NOTICE 'Calendar seed: 9 events inserted for campaign %', v_campaign_id;
END $$;
