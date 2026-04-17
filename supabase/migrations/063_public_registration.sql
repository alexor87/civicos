-- 063_public_registration.sql
-- Formulario Público de Captación con Referidos
-- Permite a ciudadanos registrarse como simpatizantes desde un link público
-- y compartir su link personal para referir a otros.

-- ── 0. Phone normalization helper ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION normalize_phone_co(phone TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  cleaned TEXT;
BEGIN
  -- Strip everything except digits
  cleaned := regexp_replace(phone, '[^0-9]', '', 'g');
  -- If starts with 57 and is 12 digits → already normalized
  IF length(cleaned) = 12 AND cleaned LIKE '57%' THEN
    RETURN cleaned;
  END IF;
  -- If 10 digits starting with 3 → Colombian mobile, prepend 57
  IF length(cleaned) = 10 AND cleaned LIKE '3%' THEN
    RETURN '57' || cleaned;
  END IF;
  -- Fallback: return cleaned digits
  RETURN cleaned;
END;
$$;

-- ── 1. public_registration_config ─────────────────────────────────────────────

CREATE TABLE public_registration_config (
  campaign_id          UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  is_active            BOOLEAN NOT NULL DEFAULT false,
  slug                 TEXT NOT NULL,
  -- Appearance
  logo_url             TEXT,
  video_url            TEXT,
  header_image_url     TEXT,
  title                TEXT,
  welcome_text         TEXT,
  primary_color        TEXT NOT NULL DEFAULT '#2262ec',
  button_text          TEXT NOT NULL DEFAULT 'Unirme',
  -- Field visibility
  show_email           BOOLEAN NOT NULL DEFAULT true,
  show_document        BOOLEAN NOT NULL DEFAULT true,
  show_gender          BOOLEAN NOT NULL DEFAULT false,
  show_age_group       BOOLEAN NOT NULL DEFAULT false,
  show_district        BOOLEAN NOT NULL DEFAULT false,
  -- Referral system
  referral_enabled     BOOLEAN NOT NULL DEFAULT true,
  level_names          JSONB NOT NULL DEFAULT '["Simpatizante","Activista","Defensor","Líder","Embajador"]',
  level_thresholds     JSONB NOT NULL DEFAULT '[0,5,15,30,50]',
  -- Legal
  authorization_text   TEXT,
  privacy_policy_url   TEXT,
  -- Notifications
  notify_new_registration BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slug must be unique across all campaigns
CREATE UNIQUE INDEX idx_prc_slug ON public_registration_config(slug);

-- ── 2. referral_events ────────────────────────────────────────────────────────

CREATE TABLE referral_events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id          UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  referrer_code        TEXT NOT NULL,
  referred_contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A contact can only be referred once per campaign
CREATE UNIQUE INDEX idx_referral_unique
  ON referral_events(campaign_id, referred_contact_id);

-- Lookup by referrer
CREATE INDEX idx_referral_referrer
  ON referral_events(campaign_id, referrer_code);

-- ── 3. registration_rate_limit ────────────────────────────────────────────────

CREATE TABLE registration_rate_limit (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address           INET NOT NULL,
  campaign_id          UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  registered_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_lookup
  ON registration_rate_limit(ip_address, campaign_id, registered_at);

-- ── 4. campaign_stats: public registration counters ───────────────────────────

ALTER TABLE campaign_stats
  ADD COLUMN registrations_public   BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN registrations_referred BIGINT NOT NULL DEFAULT 0;

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public_registration_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_rate_limit ENABLE ROW LEVEL SECURITY;

-- public_registration_config: anon can read active configs, authenticated can manage own
CREATE POLICY "anon_read_active_config"
  ON public_registration_config FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "authenticated_manage_config"
  ON public_registration_config FOR ALL
  TO authenticated
  USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      WHERE c.tenant_id = auth_tenant_id()
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      WHERE c.tenant_id = auth_tenant_id()
    )
  );

-- referral_events: anon can insert (via Edge Function), authenticated can read own
CREATE POLICY "anon_insert_referral"
  ON referral_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "authenticated_read_referrals"
  ON referral_events FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      WHERE c.tenant_id = auth_tenant_id()
    )
  );

-- rate_limit: anon can insert
CREATE POLICY "anon_insert_rate_limit"
  ON registration_rate_limit FOR INSERT
  TO anon
  WITH CHECK (true);

-- ── 6. RPC: get_public_registration_config ────────────────────────────────────

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
  privacy_policy_url   TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    prc.campaign_id, prc.slug,
    prc.logo_url, prc.video_url, prc.header_image_url,
    prc.title, prc.welcome_text, prc.primary_color, prc.button_text,
    prc.show_email, prc.show_document, prc.show_gender,
    prc.show_age_group, prc.show_district,
    prc.referral_enabled, prc.level_names, prc.level_thresholds,
    prc.authorization_text, prc.privacy_policy_url
  FROM public_registration_config prc
  WHERE prc.slug = p_slug AND prc.is_active = true;
$$;

-- ── 7. RPC: get_referrer_stats ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_referrer_stats(
  p_campaign_id UUID,
  p_referrer_code TEXT
)
RETURNS TABLE(
  referrer_name    TEXT,
  total_referrals  BIGINT,
  referrer_level   INT,
  ranking_position BIGINT,
  recent_referrals JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_config       RECORD;
  v_thresholds   JSONB;
  v_total        BIGINT;
  v_level        INT;
  v_name         TEXT;
  v_position     BIGINT;
  v_recent       JSONB;
BEGIN
  -- Get config for level thresholds
  SELECT prc.level_thresholds INTO v_thresholds
  FROM public_registration_config prc
  WHERE prc.campaign_id = p_campaign_id AND prc.is_active = true;

  IF v_thresholds IS NULL THEN
    v_thresholds := '[0,5,15,30,50]'::JSONB;
  END IF;

  -- Get referrer contact name
  SELECT c.first_name || ' ' || c.last_name INTO v_name
  FROM contacts c
  WHERE c.campaign_id = p_campaign_id
    AND normalize_phone_co(c.phone) = p_referrer_code
    AND c.deleted_at IS NULL
  LIMIT 1;

  -- Count total referrals
  SELECT COUNT(*) INTO v_total
  FROM referral_events re
  WHERE re.campaign_id = p_campaign_id
    AND re.referrer_code = p_referrer_code;

  -- Calculate level from thresholds
  v_level := 1;
  FOR i IN REVERSE (jsonb_array_length(v_thresholds) - 1) .. 0 LOOP
    IF v_total >= (v_thresholds->>i)::INT THEN
      v_level := i + 1;
      EXIT;
    END IF;
  END LOOP;

  -- Ranking position (how many referrers have more referrals + 1)
  SELECT COUNT(*) + 1 INTO v_position
  FROM (
    SELECT re2.referrer_code, COUNT(*) AS cnt
    FROM referral_events re2
    WHERE re2.campaign_id = p_campaign_id
    GROUP BY re2.referrer_code
    HAVING COUNT(*) > v_total
  ) ranked;

  -- Recent 5 referrals (name + municipality only)
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::JSONB) INTO v_recent
  FROM (
    SELECT c.first_name, c.municipality, re.created_at
    FROM referral_events re
    JOIN contacts c ON c.id = re.referred_contact_id
    WHERE re.campaign_id = p_campaign_id
      AND re.referrer_code = p_referrer_code
    ORDER BY re.created_at DESC
    LIMIT 5
  ) r;

  RETURN QUERY SELECT v_name, v_total, v_level, v_position, v_recent;
END;
$$;

-- ── 8. RPC: get_referral_ranking ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_referral_ranking(
  p_campaign_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  referrer_code   TEXT,
  referrer_name   TEXT,
  total_referrals BIGINT,
  ranking         BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    re.referrer_code,
    (
      SELECT c.first_name || ' ' || c.last_name
      FROM contacts c
      WHERE c.campaign_id = p_campaign_id
        AND normalize_phone_co(c.phone) = re.referrer_code
        AND c.deleted_at IS NULL
      LIMIT 1
    ) AS referrer_name,
    COUNT(*) AS total_referrals,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS ranking
  FROM referral_events re
  WHERE re.campaign_id = p_campaign_id
  GROUP BY re.referrer_code
  ORDER BY total_referrals DESC
  LIMIT p_limit;
$$;

-- ── 9. Grant execute on RPCs to anon ──────────────────────────────────────────

GRANT EXECUTE ON FUNCTION get_public_registration_config(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_referrer_stats(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_referral_ranking(UUID, INT) TO anon;
GRANT EXECUTE ON FUNCTION normalize_phone_co(TEXT) TO anon;

-- ── 10. Helper: increment_campaign_stat ───────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_campaign_stat(
  p_campaign_id UUID,
  p_field TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE format(
    'UPDATE campaign_stats SET %I = %I + 1, updated_at = NOW() WHERE campaign_id = $1',
    p_field, p_field
  ) USING p_campaign_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_campaign_stat(UUID, TEXT) TO anon;
