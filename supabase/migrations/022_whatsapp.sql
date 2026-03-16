-- ── WhatsApp Integration ──────────────────────────────────────────────────────
-- Migration 022: WhatsApp campaigns, conversations, and chatbot configuration

-- Extend campaigns table with WhatsApp sender number
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS twilio_whatsapp_from TEXT;

-- WhatsApp campaigns (mirrors sms_campaigns + Meta template fields)
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  template_name    TEXT NOT NULL,
  template_variables JSONB DEFAULT '{}',
  segment_id       UUID REFERENCES contact_segments(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'sent', 'failed')),
  recipient_count  INTEGER DEFAULT 0,
  sent_at          TIMESTAMPTZ,
  created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp conversations (inbound + outbound messages per contact)
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL,
  campaign_id          UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  whatsapp_campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE SET NULL,
  contact_id           UUID REFERENCES contacts(id) ON DELETE SET NULL,
  direction            TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body                 TEXT NOT NULL,
  twilio_message_sid   TEXT UNIQUE,
  status               TEXT DEFAULT 'delivered',
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp chatbot configuration per campaign
CREATE TABLE IF NOT EXISTS whatsapp_chatbot_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  enabled          BOOLEAN DEFAULT false,
  system_prompt    TEXT DEFAULT '',
  fallback_message TEXT DEFAULT 'No puedo responder esa pregunta en este momento.',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id)
);

-- RLS
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_chatbot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON whatsapp_campaigns
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON whatsapp_conversations
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON whatsapp_chatbot_config
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_tenant
  ON whatsapp_campaigns(tenant_id, campaign_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_tenant
  ON whatsapp_conversations(tenant_id, campaign_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_contact
  ON whatsapp_conversations(contact_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_created
  ON whatsapp_conversations(created_at DESC);
