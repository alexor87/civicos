// seed-demo-campaign — Puebla una campaña demo con datos realistas de Rionegro
// Invocada fire-and-forget desde /api/onboarding después de crear el tenant

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // Auth: solo service role o secret interno
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let body: { tenant_id: string; user_id: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid body' }, 400)
  }

  const { tenant_id, user_id } = body
  if (!tenant_id || !user_id) {
    return json({ error: 'tenant_id and user_id required' }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  try {
    // Marcar que el seed está en progreso
    await supabase
      .from('onboarding_state')
      .update({ stage: 'seeding', updated_at: new Date().toISOString() })
      .eq('tenant_id', tenant_id)

    // 1. Crear campaña demo
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .insert({
        tenant_id,
        name: 'Campaña Demo — Rionegro',
        description: 'Campaña de demostración con datos de ejemplo en Rionegro, Antioquia.',
        candidate_name: 'Tu Candidato',
        election_date: getFutureElectionDate(),
        config: { election_type: 'municipal' },
        is_demo: true,
        is_active: true,
      })
      .select('id')
      .single()

    if (campErr || !campaign) throw new Error(`Campaign creation failed: ${campErr?.message}`)
    const campaignId = campaign.id

    // Vincular perfil a la campaña demo
    await supabase
      .from('profiles')
      .update({ campaign_ids: [campaignId] })
      .eq('id', user_id)

    // 2. Insertar contactos (en lotes de 100)
    const contacts = generateContacts(tenant_id, campaignId)
    const contactIds: string[] = []
    for (let i = 0; i < contacts.length; i += 100) {
      const batch = contacts.slice(i, i + 100)
      const { data, error } = await supabase
        .from('contacts')
        .insert(batch)
        .select('id')
      if (error) throw new Error(`Contacts batch ${i} failed: ${error.message}`)
      contactIds.push(...(data?.map(c => c.id) ?? []))
    }

    // 3. Insertar territorios
    const territories = generateTerritories(tenant_id, campaignId, user_id)
    const { data: terData, error: terErr } = await supabase
      .from('territories')
      .insert(territories)
      .select('id')
    if (terErr) throw new Error(`Territories failed: ${terErr.message}`)
    const territoryIds = terData?.map(t => t.id) ?? []

    // 4. Insertar visitas de canvassing
    const visits = generateVisits(tenant_id, campaignId, contactIds, territoryIds, user_id)
    for (let i = 0; i < visits.length; i += 50) {
      const batch = visits.slice(i, i + 50)
      const { error } = await supabase.from('canvass_visits').insert(batch)
      if (error) throw new Error(`Visits batch ${i} failed: ${error.message}`)
    }

    // 5. Insertar eventos de calendario
    const events = generateEvents(tenant_id, campaignId, user_id)
    const { error: evErr } = await supabase.from('calendar_events').insert(events)
    if (evErr) throw new Error(`Events failed: ${evErr.message}`)

    // 6. Insertar sugerencias IA
    const suggestions = generateSuggestions(tenant_id, campaignId)
    const { error: sugErr } = await supabase.from('ai_suggestions').insert(suggestions)
    if (sugErr) throw new Error(`Suggestions failed: ${sugErr.message}`)

    // 7. Marcar onboarding como demo listo
    await supabase
      .from('onboarding_state')
      .update({
        stage: 'demo',
        demo_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenant_id)

    return json({
      success: true,
      campaign_id: campaignId,
      contacts: contactIds.length,
      territories: territoryIds.length,
      visits: visits.length,
      events: events.length,
      suggestions: suggestions.length,
    })
  } catch (err) {
    console.error('seed-demo-campaign error:', err)
    // Revertir estado a pending para que se pueda reintentar
    await supabase
      .from('onboarding_state')
      .update({ stage: 'pending', updated_at: new Date().toISOString() })
      .eq('tenant_id', tenant_id)
    return json({ error: (err as Error).message }, 500)
  }
})

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function getFutureElectionDate(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 4)
  return d.toISOString().split('T')[0]
}

// Seeded random for deterministic data
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ────────────────────────────────────────────────────────────
// Data generators
// ────────────────────────────────────────────────────────────

function generateContacts(tenantId: string, campaignId: string) {
  const rand = seededRandom(42)
  const contacts = []

  // Rionegro center: 6.1552° N, -75.3743° W
  const CENTER_LAT = 6.1552
  const CENTER_LNG = -75.3743
  const SPREAD = 0.025

  const FIRST_NAMES = [
    'Carlos', 'María', 'José', 'Ana', 'Juan', 'Luisa', 'Andrés', 'Paola',
    'Diego', 'Catalina', 'Luis', 'Diana', 'Santiago', 'Laura', 'Felipe',
    'Camila', 'Daniel', 'Valentina', 'Sebastián', 'Natalia', 'Alejandro',
    'Sofía', 'Mateo', 'Isabella', 'Nicolás', 'Gabriela', 'Samuel', 'Juliana',
    'David', 'Mariana', 'Miguel', 'Daniela', 'Tomás', 'Paula', 'Emilio',
    'Andrea', 'Ricardo', 'Fernanda', 'Simón', 'Claudia', 'Esteban', 'Mónica',
    'Joaquín', 'Elena', 'Rafael', 'Rosa', 'Gabriel', 'Adriana', 'Martín', 'Estela',
  ]

  const LAST_NAMES = [
    'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández',
    'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez',
    'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez', 'Ortiz', 'Ruiz',
    'Vargas', 'Mendoza', 'Jiménez', 'Romero', 'Álvarez', 'Castillo',
    'Herrera', 'Medina', 'Aguilar', 'Peña', 'Salazar', 'Ospina',
    'Cardona', 'Ríos', 'Mejía', 'Valencia', 'Ocampo', 'Arango',
    'Muñoz', 'Betancur', 'Giraldo', 'Zapata', 'Londoño', 'Jaramillo',
    'Castaño', 'Henao', 'Duque', 'Montoya', 'Echeverri', 'Aristizábal',
  ]

  const DISTRICTS = [
    'Centro', 'La Cuarta', 'Gualanday', 'San Antonio', 'Cuatro Esquinas',
    'Belchite', 'Alto del Medio', 'Chipre', 'Bosques de Santana',
    'Llanogrande', 'Tablacito', 'San Luis', 'Galicia', 'El Porvenir',
  ]

  const ADDRESSES = [
    'Cra', 'Cll', 'Av', 'Diag', 'Transv',
  ]

  for (let i = 0; i < 500; i++) {
    const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
    const lastName1 = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
    const lastName2 = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
    const district = DISTRICTS[Math.floor(rand() * DISTRICTS.length)]

    // Status distribution: 62% supporter, 24% undecided, 14% opponent
    const statusRoll = rand()
    const status = statusRoll < 0.62 ? 'supporter'
      : statusRoll < 0.86 ? 'undecided'
      : statusRoll < 0.93 ? 'opponent'
      : 'unknown'

    const lat = CENTER_LAT + (rand() - 0.5) * 2 * SPREAD
    const lng = CENTER_LNG + (rand() - 0.5) * 2 * SPREAD

    const addrType = ADDRESSES[Math.floor(rand() * ADDRESSES.length)]
    const addrNum = Math.floor(rand() * 50) + 1
    const addrSec = Math.floor(rand() * 30) + 1

    const hasPhone = rand() > 0.2
    const hasEmail = rand() > 0.5

    contacts.push({
      tenant_id: tenantId,
      campaign_id: campaignId,
      first_name: firstName,
      last_name: `${lastName1} ${lastName2}`,
      email: hasEmail ? `${firstName.toLowerCase()}.${lastName1.toLowerCase()}${i}@ejemplo.co` : null,
      phone: hasPhone ? `+573${Math.floor(rand() * 10)}${String(Math.floor(rand() * 10000000)).padStart(7, '0')}` : null,
      address: `${addrType} ${addrNum} #${addrSec}-${Math.floor(rand() * 99) + 1}`,
      city: 'Rionegro',
      district,
      status,
      tags: [],
      notes: null,
      metadata: {},
      latitude: Math.round(lat * 1000000) / 1000000,
      longitude: Math.round(lng * 1000000) / 1000000,
    })
  }

  return contacts
}

function generateTerritories(tenantId: string, campaignId: string, createdBy: string) {
  // 4 zonas reales de Rionegro con polígonos simplificados
  return [
    {
      tenant_id: tenantId,
      campaign_id: campaignId,
      name: 'Centro Histórico',
      description: 'Zona central de Rionegro, incluye parque principal y alrededores.',
      color: '#2960ec',
      status: 'en_progreso',
      priority: 'alta',
      estimated_contacts: 150,
      created_by: createdBy,
      geojson: {
        type: 'Feature',
        properties: { name: 'Centro Histórico' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-75.3780, 6.1580], [-75.3710, 6.1580], [-75.3710, 6.1520],
            [-75.3780, 6.1520], [-75.3780, 6.1580],
          ]],
        },
      },
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignId,
      name: 'Cuatro Esquinas — Gualanday',
      description: 'Sector residencial al noroccidente.',
      color: '#10b981',
      status: 'asignado',
      priority: 'media',
      estimated_contacts: 130,
      created_by: createdBy,
      geojson: {
        type: 'Feature',
        properties: { name: 'Cuatro Esquinas — Gualanday' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-75.3820, 6.1620], [-75.3780, 6.1620], [-75.3780, 6.1580],
            [-75.3820, 6.1580], [-75.3820, 6.1620],
          ]],
        },
      },
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignId,
      name: 'San Antonio — Chipre',
      description: 'Zona oriental con urbanizaciones recientes.',
      color: '#f59e0b',
      status: 'disponible',
      priority: 'media',
      estimated_contacts: 120,
      created_by: createdBy,
      geojson: {
        type: 'Feature',
        properties: { name: 'San Antonio — Chipre' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-75.3710, 6.1580], [-75.3650, 6.1580], [-75.3650, 6.1530],
            [-75.3710, 6.1530], [-75.3710, 6.1580],
          ]],
        },
      },
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignId,
      name: 'Alto del Medio — Bosques',
      description: 'Zona sur con barrios consolidados.',
      color: '#8b5cf6',
      status: 'disponible',
      priority: 'baja',
      estimated_contacts: 100,
      created_by: createdBy,
      geojson: {
        type: 'Feature',
        properties: { name: 'Alto del Medio — Bosques' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-75.3780, 6.1520], [-75.3710, 6.1520], [-75.3710, 6.1470],
            [-75.3780, 6.1470], [-75.3780, 6.1520],
          ]],
        },
      },
    },
  ]
}

function generateVisits(
  tenantId: string,
  campaignId: string,
  contactIds: string[],
  territoryIds: string[],
  volunteerId: string,
) {
  const rand = seededRandom(123)
  const visits = []

  const RESULTS: string[] = [
    'positive', 'positive', 'positive', 'positive', // 40%
    'contacted', 'contacted',                        // 20%
    'undecided', 'undecided',                        // 20%
    'not_home',                                      // 10%
    'follow_up',                                     // 10%
  ]

  const NOTES = [
    'Muy interesado en propuestas de seguridad.',
    'Pidió información sobre plan de vivienda.',
    'Le preocupa el estado de las vías.',
    'Conoce al candidato de la otra campaña.',
    'Quiere saber sobre propuestas de educación.',
    'Preguntó por los horarios de eventos.',
    'Dijo que lo piensa y nos avisa.',
    'Interesada en participar como voluntaria.',
    'Familia numerosa, todos votantes.',
    'Ya tiene decidido su voto a favor.',
    'Pide mejoras en el parque del barrio.',
    'Quiere reunión con el candidato.',
    null, null, null, // Some visits without notes
  ]

  // Generate visits spread over the last 30 days
  const now = Date.now()
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

  for (let i = 0; i < 180; i++) {
    const contactIdx = Math.floor(rand() * Math.min(contactIds.length, 300)) // visits on first 300 contacts
    const result = RESULTS[Math.floor(rand() * RESULTS.length)]
    const notes = NOTES[Math.floor(rand() * NOTES.length)]
    const territoryId = territoryIds[Math.floor(rand() * territoryIds.length)]
    const daysAgo = Math.floor(rand() * THIRTY_DAYS)
    const createdAt = new Date(now - daysAgo).toISOString()

    const sympathyLevel = result === 'positive' ? (Math.floor(rand() * 2) + 4) // 4-5
      : result === 'contacted' ? (Math.floor(rand() * 2) + 3) // 3-4
      : result === 'undecided' ? 3
      : null

    visits.push({
      tenant_id: tenantId,
      campaign_id: campaignId,
      contact_id: contactIds[contactIdx],
      territory_id: territoryId,
      volunteer_id: volunteerId,
      result,
      notes,
      sympathy_level: sympathyLevel,
      attempt_number: 1,
      status: 'submitted',
      created_at: createdAt,
    })
  }

  return visits
}

function generateEvents(tenantId: string, campaignId: string, createdBy: string) {
  const now = new Date()
  const events = []

  const EVENT_DATA = [
    {
      title: 'Reunión comunitaria — Centro',
      event_type: 'public_event',
      daysFromNow: 3,
      hours: [18, 20],
      location_text: 'Parque Principal de Rionegro',
      municipality_name: 'Rionegro',
      neighborhood_name: 'Centro',
      description: 'Encuentro con líderes comunitarios del centro histórico para presentar propuestas de seguridad y movilidad.',
      expected_attendance: 80,
    },
    {
      title: 'Recorrido puerta a puerta — Gualanday',
      event_type: 'canvassing',
      daysFromNow: 5,
      hours: [9, 13],
      location_text: 'Barrio Gualanday, sector norte',
      municipality_name: 'Rionegro',
      neighborhood_name: 'Gualanday',
      description: 'Jornada de canvassing en el sector Gualanday. Llevar material de campaña y formatos de registro.',
      expected_attendance: 15,
    },
    {
      title: 'Debate en radio local',
      event_type: 'media_debate',
      daysFromNow: 7,
      hours: [7, 8],
      location_text: 'Emisora Rionegro Stereo',
      municipality_name: 'Rionegro',
      neighborhood_name: 'Centro',
      description: 'Debate radial con candidatos al Concejo. Temas: presupuesto participativo y seguridad.',
      expected_attendance: null,
    },
    {
      title: 'Comité de campaña semanal',
      event_type: 'internal_meeting',
      daysFromNow: 2,
      hours: [19, 21],
      location_text: 'Sede de campaña',
      municipality_name: 'Rionegro',
      neighborhood_name: 'Centro',
      description: 'Revisión de métricas, asignación de territorios y planificación de la semana.',
      expected_attendance: 12,
    },
    {
      title: 'Evento de recaudación — Cena solidaria',
      event_type: 'fundraising',
      daysFromNow: 12,
      hours: [19, 22],
      location_text: 'Restaurante El Portal, Llanogrande',
      municipality_name: 'Rionegro',
      neighborhood_name: 'Llanogrande',
      description: 'Cena de recaudación con empresarios y líderes de opinión del municipio.',
      expected_attendance: 50,
    },
    {
      title: 'Visita institucional — JAC San Antonio',
      event_type: 'institutional_visit',
      daysFromNow: 8,
      hours: [10, 12],
      location_text: 'Salón comunal San Antonio',
      municipality_name: 'Rionegro',
      neighborhood_name: 'San Antonio',
      description: 'Reunión con la Junta de Acción Comunal para escuchar necesidades del barrio.',
      expected_attendance: 25,
    },
    {
      title: 'Jornada de fotos y video — Redes sociales',
      event_type: 'media_session',
      daysFromNow: 4,
      hours: [14, 17],
      location_text: 'Diferentes puntos de Rionegro',
      municipality_name: 'Rionegro',
      neighborhood_name: null,
      description: 'Sesión de contenido para redes sociales. Recorrido por zonas emblemáticas.',
      expected_attendance: 5,
    },
    {
      title: 'Cierre de inscripciones de candidatos',
      event_type: 'electoral_date',
      daysFromNow: -5,
      hours: [0, 23],
      location_text: 'Registraduría Municipal',
      municipality_name: 'Rionegro',
      neighborhood_name: 'Centro',
      description: 'Fecha límite para inscripción de candidatos ante la Registraduría.',
      expected_attendance: null,
    },
  ]

  for (const ev of EVENT_DATA) {
    const start = new Date(now)
    start.setDate(start.getDate() + ev.daysFromNow)
    start.setHours(ev.hours[0], 0, 0, 0)

    const end = new Date(start)
    end.setHours(ev.hours[1], 0, 0, 0)

    events.push({
      tenant_id: tenantId,
      campaign_id: campaignId,
      created_by: createdBy,
      title: ev.title,
      event_type: ev.event_type,
      status: ev.daysFromNow < 0 ? 'completed' : 'confirmed',
      all_day: ev.event_type === 'electoral_date',
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      location_text: ev.location_text,
      municipality_name: ev.municipality_name,
      neighborhood_name: ev.neighborhood_name,
      description: ev.description,
      expected_attendance: ev.expected_attendance,
    })
  }

  return events
}

function generateSuggestions(tenantId: string, campaignId: string) {
  return [
    {
      tenant_id: tenantId,
      campaign_id: campaignId,
      type: 'insight',
      module: 'territorio',
      priority: 'high',
      title: 'San Antonio tiene alto potencial sin explorar',
      description: 'El territorio San Antonio — Chipre tiene 120 contactos estimados pero solo 12 visitas registradas. Con una tasa de simpatía del 68% en la zona, es una oportunidad clave para asignar voluntarios esta semana.',
      reasoning: 'Análisis de densidad de contactos vs visitas realizadas por zona.',
      estimated_impact: 'Captar 30-40 nuevos simpatizantes si se realiza canvassing esta semana.',
      action_payload: { action: 'assign_territory', territory_name: 'San Antonio — Chipre' },
      status: 'active',
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignId,
      type: 'alert',
      module: 'canvassing',
      priority: 'medium',
      title: '23 contactos indecisos sin seguimiento',
      description: 'Hay 23 contactos marcados como "indeciso" que no han recibido una segunda visita en más de 7 días. Estudios muestran que el seguimiento oportuno duplica la tasa de conversión.',
      reasoning: 'Detección de contactos con resultado "undecided" sin visita posterior en 7+ días.',
      estimated_impact: 'Convertir 8-12 indecisos en simpatizantes con una segunda visita personalizada.',
      action_payload: { action: 'create_followup_list', filter: 'undecided_no_followup' },
      status: 'active',
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignId,
      type: 'suggestion',
      module: 'calendario',
      priority: 'medium',
      title: 'Programar evento en Alto del Medio',
      description: 'Alto del Medio — Bosques es el territorio con menor actividad. No hay eventos programados en esa zona. Una reunión comunitaria podría activar el territorio antes de la jornada de canvassing.',
      reasoning: 'Correlación entre eventos previos y efectividad de canvassing posterior.',
      estimated_impact: 'Mejorar recepción del canvassing en 25-35% con evento previo de sensibilización.',
      action_payload: { action: 'suggest_event', territory_name: 'Alto del Medio — Bosques', event_type: 'public_event' },
      status: 'active',
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignId,
      type: 'insight',
      module: 'contactos',
      priority: 'low',
      title: 'El 68% de tus simpatizantes son del Centro',
      description: 'La concentración de simpatizantes en el Centro Histórico es alta (68%), mientras que zonas periféricas tienen menor penetración. Diversificar la estrategia geográfica fortalecerá la campaña.',
      reasoning: 'Distribución geográfica de contactos por status y zona.',
      estimated_impact: 'Reducir riesgo de dependencia en una sola zona.',
      action_payload: { action: 'view_territory_report' },
      status: 'active',
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignId,
      type: 'suggestion',
      module: 'comunicaciones',
      priority: 'high',
      title: 'Enviar resumen semanal a simpatizantes',
      description: 'Tienes 310 simpatizantes con email registrado. Un resumen semanal de actividades y logros de la campaña mantiene el engagement y facilita la movilización para el día de elecciones.',
      reasoning: 'Best practice: campañas que envían comunicaciones semanales tienen 40% más asistencia a eventos.',
      estimated_impact: 'Aumentar asistencia a eventos en 15-20 personas por evento.',
      action_payload: { action: 'create_email_campaign', segment: 'supporters_with_email' },
      status: 'active',
    },
  ]
}
