-- 066_whatsapp_share_message.sql
-- Add customizable WhatsApp share message to public registration config

ALTER TABLE public_registration_config
  ADD COLUMN whatsapp_share_message TEXT DEFAULT '¡Únete a nuestra causa! Regístrate aquí: {link}';

-- Recreate RPC to include new column
DROP FUNCTION IF EXISTS get_public_registration_config(text);

CREATE OR REPLACE FUNCTION get_public_registration_config(p_slug TEXT)
RETURNS TABLE(
  campaign_id          UUID,
  slug                 TEXT,
  logo_url             TEXT,
  video_url            TEXT,
  header_image_url     TEXT,
  title                TEXT,
  welcome_text         TEXT,
  primary_color        TEXT,
  button_text          TEXT,
  show_email           BOOLEAN,
  show_document        BOOLEAN,
  show_gender          BOOLEAN,
  show_age_group       BOOLEAN,
  show_district        BOOLEAN,
  referral_enabled     BOOLEAN,
  level_names          JSONB,
  level_thresholds     JSONB,
  authorization_text   TEXT,
  privacy_policy_url   TEXT,
  geo_department_code  TEXT,
  geo_department_name  TEXT,
  geo_municipality_name TEXT,
  whatsapp_share_message TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    prc.campaign_id, prc.slug,
    prc.logo_url, prc.video_url, prc.header_image_url,
    prc.title, prc.welcome_text, prc.primary_color, prc.button_text,
    prc.show_email, prc.show_document, prc.show_gender,
    prc.show_age_group, prc.show_district,
    prc.referral_enabled, prc.level_names, prc.level_thresholds,
    prc.authorization_text, prc.privacy_policy_url,
    prc.geo_department_code, prc.geo_department_name, prc.geo_municipality_name,
    prc.whatsapp_share_message
  FROM public_registration_config prc
  WHERE prc.slug = p_slug AND prc.is_active = true;
$$;
