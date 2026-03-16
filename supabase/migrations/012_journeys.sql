-- ── 012_journeys.sql ─────────────────────────────────────────────────────────
-- Journey Builder: automatizaciones de comunicación basadas en triggers

-- journeys: definición de una secuencia de pasos
CREATE TABLE IF NOT EXISTS journeys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  trigger_type   TEXT NOT NULL CHECK (trigger_type IN ('contact_created', 'tag_added', 'manual', 'no_activity_30d')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  -- nodes: [{ id, type: 'trigger'|'email'|'sms'|'wait', position: {x,y}, data: {...} }]
  nodes          JSONB NOT NULL DEFAULT '[]',
  -- edges: [{ id, source, target }]
  edges          JSONB NOT NULL DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- journey_enrollments: seguimiento de cada contacto en un journey
CREATE TABLE IF NOT EXISTS journey_enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id   UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  contact_id   UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  current_node TEXT,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_run_at  TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  UNIQUE(journey_id, contact_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_journeys_campaign_id ON journeys(campaign_id);
CREATE INDEX IF NOT EXISTS idx_journey_enrollments_journey_id ON journey_enrollments(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_enrollments_next_run ON journey_enrollments(next_run_at) WHERE status = 'active';

-- RLS
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant journeys" ON journeys
  USING (campaign_id IN (
    SELECT unnest(campaign_ids) FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "tenant enrollments" ON journey_enrollments
  USING (journey_id IN (
    SELECT id FROM journeys WHERE campaign_id IN (
      SELECT unnest(campaign_ids) FROM profiles WHERE id = auth.uid()
    )
  ));

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_journeys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journeys_updated_at
  BEFORE UPDATE ON journeys
  FOR EACH ROW EXECUTE FUNCTION update_journeys_updated_at();
