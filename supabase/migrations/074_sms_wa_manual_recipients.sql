-- 074_sms_wa_manual_recipients.sql
-- Restores sms_campaigns, whatsapp_campaigns, whatsapp_conversations and
-- whatsapp_chatbot_config tables (missing in prod despite migrations 008/022
-- being registered as applied), and introduces manual contact selection via
-- a new recipient_ids uuid[] column on both campaign tables.
--
-- When recipient_ids is NOT NULL, it overrides segment_id at send time.
-- Mirrors the email pattern introduced in 070_email_manual_recipients.

-- ── SMS campaigns ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sms_campaigns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_id      uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name             text NOT NULL,
  body_text        text NOT NULL,
  segment_id       uuid REFERENCES public.contact_segments(id) ON DELETE SET NULL,
  recipient_ids    uuid[],
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'sent', 'failed')),
  recipient_count  integer NOT NULL DEFAULT 0,
  sent_at          timestamptz,
  created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_campaigns
  ADD COLUMN IF NOT EXISTS recipient_ids uuid[];

COMMENT ON COLUMN public.sms_campaigns.recipient_ids IS
  'Manually selected contact IDs. When set, overrides segment_id.';

CREATE INDEX IF NOT EXISTS sms_campaigns_tenant_id_idx   ON public.sms_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS sms_campaigns_campaign_id_idx ON public.sms_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS sms_campaigns_status_idx      ON public.sms_campaigns(status);

ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sms_campaigns_tenant_isolation" ON public.sms_campaigns;
CREATE POLICY "sms_campaigns_tenant_isolation"
  ON public.sms_campaigns
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ── WhatsApp campaigns ────────────────────────────────────────────────────────

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS twilio_whatsapp_from text;

CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL,
  campaign_id        uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name               text NOT NULL,
  template_name      text NOT NULL,
  template_variables jsonb DEFAULT '{}'::jsonb,
  segment_id         uuid REFERENCES public.contact_segments(id) ON DELETE SET NULL,
  recipient_ids      uuid[],
  status             text NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'sent', 'failed')),
  recipient_count    integer DEFAULT 0,
  sent_at            timestamptz,
  created_by         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_campaigns
  ADD COLUMN IF NOT EXISTS recipient_ids uuid[];

COMMENT ON COLUMN public.whatsapp_campaigns.recipient_ids IS
  'Manually selected contact IDs. When set, overrides segment_id.';

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_tenant
  ON public.whatsapp_campaigns(tenant_id, campaign_id);

ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON public.whatsapp_campaigns;
CREATE POLICY "tenant_isolation" ON public.whatsapp_campaigns
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ── WhatsApp conversations ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  campaign_id           uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  whatsapp_campaign_id  uuid REFERENCES public.whatsapp_campaigns(id) ON DELETE SET NULL,
  contact_id            uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  direction             text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body                  text NOT NULL,
  twilio_message_sid    text UNIQUE,
  status                text DEFAULT 'delivered',
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_tenant
  ON public.whatsapp_conversations(tenant_id, campaign_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_contact
  ON public.whatsapp_conversations(contact_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_created
  ON public.whatsapp_conversations(created_at DESC);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON public.whatsapp_conversations;
CREATE POLICY "tenant_isolation" ON public.whatsapp_conversations
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ── WhatsApp chatbot config ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.whatsapp_chatbot_config (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  campaign_id       uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  enabled           boolean DEFAULT false,
  system_prompt     text DEFAULT '',
  fallback_message  text DEFAULT 'No puedo responder esa pregunta en este momento.',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(campaign_id)
);

ALTER TABLE public.whatsapp_chatbot_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON public.whatsapp_chatbot_config;
CREATE POLICY "tenant_isolation" ON public.whatsapp_chatbot_config
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
