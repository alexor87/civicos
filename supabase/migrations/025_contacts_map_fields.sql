-- Migration 025: Nuevas columnas en contacts para filtros del mapa de calor

-- 1. Agregar columnas de segmentación a la tabla contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS campaign_role TEXT,
  ADD COLUMN IF NOT EXISTS electoral_priority TEXT,
  ADD COLUMN IF NOT EXISTS capture_source TEXT;

-- 2. Seed demo aleatorio para la campaña Rionegro
UPDATE contacts SET
  campaign_role      = (ARRAY['coordinador','voluntario','donante','simpatizante',NULL])[FLOOR(RANDOM()*5+1)],
  electoral_priority = (ARRAY['alta','media','baja'])[FLOOR(RANDOM()*3+1)],
  capture_source     = (ARRAY['canvassing','whatsapp','referido','web','evento'])[FLOOR(RANDOM()*5+1)],
  status             = (ARRAY['supporter','undecided','opponent','unknown']::"contact_status"[])[FLOOR(RANDOM()*4+1)]
WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af';

-- 3. Seed vote_intention en las visitas de canvassing de la campaña demo
UPDATE canvass_visits
SET vote_intention = (ARRAY['si','no','indeciso'])[FLOOR(RANDOM()*3+1)]
WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af'
  AND vote_intention IS NULL;
