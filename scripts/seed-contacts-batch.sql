-- Insert 100K contacts per execution (run 5 times with different offsets)
-- Pass offset via psql variable: -v batch_offset=0

DO $$
DECLARE
  v_campaign_id UUID := '37f9b055-d6de-465c-8369-196f4bc018af';
  v_tenant_id   UUID;
  v_offset      INT := {OFFSET};
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM campaigns WHERE id = v_campaign_id;

  INSERT INTO contacts (
    tenant_id, campaign_id, first_name, last_name, email, phone,
    document_type, document_number,
    status, department, municipality,
    address, city,
    location_lat, location_lng, geocoding_status,
    tags, metadata, created_at
  )
  SELECT
    v_tenant_id,
    v_campaign_id,
    (ARRAY['Juan','María','Carlos','Ana','Luis','Diana','Pedro','Laura',
           'Jorge','Sofía','Andrés','Camila','Diego','Valentina','Miguel',
           'Isabella','José','Daniela','David','Natalia'])[1 + (i % 20)],
    (ARRAY['García','Rodríguez','Martínez','López','González','Hernández',
           'Pérez','Sánchez','Ramírez','Torres','Flores','Rivera',
           'Gómez','Díaz','Cruz','Morales','Reyes','Gutiérrez',
           'Ortiz','Ruiz'])[1 + ((i * 7) % 20)],
    CASE WHEN i % 10 < 7 THEN 'stress_' || i || '@test.com' ELSE NULL END,
    CASE WHEN i % 10 < 8 THEN '3' || LPAD((100000000 + i)::TEXT, 9, '0') ELSE NULL END,
    'CC',
    'STRESS_' || LPAD(i::TEXT, 7, '0'),
    (ARRAY['supporter','supporter','supporter','supporter','supporter',
           'supporter','supporter','undecided','undecided','undecided',
           'undecided','undecided','opponent','opponent','opponent',
           'unknown','unknown','unknown','unknown','unknown'])[1 + (i % 20)]::contact_status,
    (ARRAY['Antioquia','Antioquia','Antioquia','Cundinamarca','Valle del Cauca',
           'Antioquia','Antioquia','Santander','Boyacá','Antioquia'])[1 + (i % 10)],
    (ARRAY['Rionegro','Medellín','Envigado','Bogotá','Cali',
           'Bello','Itagüí','Bucaramanga','Tunja','Sabaneta'])[1 + (i % 10)],
    'Calle ' || (1 + i % 100)::TEXT || ' # ' || (1 + i % 50)::TEXT || '-' || (1 + i % 200)::TEXT,
    (ARRAY['Rionegro','Medellín','Envigado','Bogotá','Cali'])[1 + (i % 5)],
    CASE WHEN i % 10 < 6 THEN 5.9 + (random() * 0.5) ELSE NULL END,
    CASE WHEN i % 10 < 6 THEN -75.7 + (random() * 0.6) ELSE NULL END,
    CASE WHEN i % 10 < 6 THEN 'geocoded' ELSE 'pending' END,
    CASE WHEN i % 5 = 0 THEN ARRAY['vip'] WHEN i % 7 = 0 THEN ARRAY['zona-norte','referido'] ELSE ARRAY[]::TEXT[] END,
    '{}'::JSONB,
    NOW() - ((i % 180) || ' days')::INTERVAL - ((i % 1440) || ' minutes')::INTERVAL
  FROM generate_series(v_offset + 1, v_offset + 100000) AS s(i);

  RAISE NOTICE 'Batch complete: % to %', v_offset + 1, v_offset + 100000;
END;
$$;
