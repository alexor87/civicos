-- ============================================================
-- 054_cascade_campaign_fks.sql — FK cascade hacia campaigns
-- ============================================================
-- Fix: activate_real_campaign asume ON DELETE CASCADE al borrar
-- la campaña demo, pero varias FKs fueron creadas sin cascade.
-- Esto bloquea la aprobación de cuentas en backoffice con el error
-- "update or delete on table campaigns violates foreign key constraint
-- territories_campaign_id_fkey on table territories".

-- territories
ALTER TABLE territories DROP CONSTRAINT territories_campaign_id_fkey;
ALTER TABLE territories ADD CONSTRAINT territories_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

-- canvass_scripts
ALTER TABLE canvass_scripts DROP CONSTRAINT canvass_scripts_campaign_id_fkey;
ALTER TABLE canvass_scripts ADD CONSTRAINT canvass_scripts_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

-- contact_segments
ALTER TABLE contact_segments DROP CONSTRAINT contact_segments_campaign_id_fkey;
ALTER TABLE contact_segments ADD CONSTRAINT contact_segments_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

-- email_campaigns
ALTER TABLE email_campaigns DROP CONSTRAINT email_campaigns_campaign_id_fkey;
ALTER TABLE email_campaigns ADD CONSTRAINT email_campaigns_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

-- geo_units
ALTER TABLE geo_units DROP CONSTRAINT geo_units_campaign_id_fkey;
ALTER TABLE geo_units ADD CONSTRAINT geo_units_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

-- calendar_events
ALTER TABLE calendar_events DROP CONSTRAINT calendar_events_campaign_id_fkey;
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

-- calendar_integrations
ALTER TABLE calendar_integrations DROP CONSTRAINT calendar_integrations_campaign_id_fkey;
ALTER TABLE calendar_integrations ADD CONSTRAINT calendar_integrations_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
