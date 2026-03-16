-- Migration 010: Campaign settings profile columns
-- Adds fields needed for AI agents context + integrations config

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS candidate_name  TEXT,
  ADD COLUMN IF NOT EXISTS election_type   TEXT,        -- municipal | regional | nacional | otro
  ADD COLUMN IF NOT EXISTS election_date   DATE,
  ADD COLUMN IF NOT EXISTS key_topics      TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description     TEXT,        -- propuesta política / contexto para agentes IA
  ADD COLUMN IF NOT EXISTS brand_color     TEXT    DEFAULT '#2960ec',
  ADD COLUMN IF NOT EXISTS logo_url        TEXT,
  ADD COLUMN IF NOT EXISTS resend_domain   TEXT,        -- dominio verificado para email
  ADD COLUMN IF NOT EXISTS twilio_sid      TEXT,        -- Twilio Account SID
  ADD COLUMN IF NOT EXISTS twilio_token    TEXT,        -- Twilio Auth Token
  ADD COLUMN IF NOT EXISTS twilio_from     TEXT;        -- número de origen SMS

COMMENT ON COLUMN campaigns.candidate_name IS 'Nombre del candidato o campaña';
COMMENT ON COLUMN campaigns.election_type  IS 'Tipo de elección: municipal, regional, nacional, otro';
COMMENT ON COLUMN campaigns.election_date  IS 'Fecha de la elección — usada por agentes para calcular urgencia';
COMMENT ON COLUMN campaigns.key_topics     IS 'Temas clave de la campaña — contexto para generación de contenido IA';
COMMENT ON COLUMN campaigns.description    IS 'Propuesta política y valores de la campaña — contexto para agentes';
