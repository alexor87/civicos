#!/usr/bin/env node
/**
 * seed-demo.mjs
 * Crea la empresa demo "Campaña Rionegro Avanza" con datos realistas.
 * No requiere el servidor Next.js — trabaja directo con Supabase admin API.
 *
 * Uso (desde apps/web/):
 *   node scripts/seed-demo.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import postgres from 'postgres'

const __dirname = dirname(fileURLToPath(import.meta.url))
const webDir    = resolve(__dirname, '..')
const envPath   = join(webDir, '.env.local')

// ── Leer .env.local ───────────────────────────────────────────────────────────
function loadEnv(path) {
  const env = {}
  try {
    readFileSync(path, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) env[m[1].trim()] = m[2].trim()
    })
  } catch {
    console.error('No se encontró .env.local en', path)
    process.exit(1)
  }
  return env
}

const env          = loadEnv(envPath)
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY']
const DB_PASSWORD  = env['DB_PASSWORD'] || process.env.DB_PASSWORD

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Extraer host de la URL de Supabase (ej: hugufyyhiiqwbxvxbinm.supabase.co)
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0]
const DB_HOST    = `db.${projectRef}.supabase.co`

// ── Helpers ───────────────────────────────────────────────────────────────────
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function cc() { return String(rndInt(10000000, 99999999)) + String(rndInt(10, 99)) }
function birthDate(minAge, maxAge) {
  const year  = 2026 - rndInt(minAge, maxAge)
  const month = String(rndInt(1, 12)).padStart(2, '0')
  const day   = String(rndInt(1, 28)).padStart(2, '0')
  return `${year}-${month}-${day}`
}
function pastDate(daysBack) {
  const d = new Date()
  d.setDate(d.getDate() - rndInt(1, daysBack))
  return d.toISOString()
}

// ── Colombia geo parser (ported from colombia-import.ts) ──────────────────────
const DEPT_NAMES = {
  '05': 'Antioquia', '08': 'Atlántico', '11': 'Bogotá D.C.', '13': 'Bolívar',
  '17': 'Caldas', '50': 'Meta', '54': 'Norte de Santander', '63': 'Quindío',
  '66': 'Risaralda', '68': 'Santander', '73': 'Tolima', '76': 'Valle del Cauca',
}

function parseColombiaFormat(data) {
  const rows = []
  const deptosSeen = new Set()

  for (const ciudad of data.ciudades) {
    const deptCodigo = String(ciudad.departamento_codigo ?? '')
    const deptNombre = DEPT_NAMES[deptCodigo] ?? `Departamento ${deptCodigo}`

    if (!deptosSeen.has(deptCodigo)) {
      rows.push({ tipo: 'departamento', nombre: deptNombre, codigo: deptCodigo })
      deptosSeen.add(deptCodigo)
    }

    const munNombre = String(ciudad.municipio_nombre ?? '')
    rows.push({ tipo: 'municipio', nombre: munNombre, codigo: String(ciudad.municipio_codigo ?? ''), padre: deptNombre })

    for (const loc of ciudad.localidades ?? []) {
      const locNombre = String(loc.nombre ?? '')
      rows.push({ tipo: 'localidad', nombre: locNombre, codigo: String(loc.codigo ?? ''), padre: munNombre })
      if (Array.isArray(loc.upz) && loc.upz.length > 0) {
        for (const upz of loc.upz) {
          const upzNombre = String(upz.nombre ?? '')
          rows.push({ tipo: 'upz', nombre: upzNombre, codigo: String(upz.codigo ?? ''), padre: locNombre })
          for (const barrio of upz.barrios ?? []) {
            rows.push({ tipo: 'barrio', nombre: barrio, padre: upzNombre })
          }
        }
      } else {
        for (const barrio of loc.barrios ?? []) {
          rows.push({ tipo: 'barrio', nombre: barrio, padre: locNombre })
        }
      }
    }

    for (const comuna of ciudad.comunas ?? []) {
      const comunaNombre = String(comuna.nombre ?? '')
      rows.push({ tipo: 'comuna', nombre: comunaNombre, codigo: String(comuna.codigo ?? ''), padre: munNombre })
      for (const barrio of comuna.barrios ?? []) {
        if (typeof barrio === 'string') {
          rows.push({ tipo: 'barrio', nombre: barrio, padre: comunaNombre })
        } else {
          const bNombre = String(barrio.nombre ?? '')
          rows.push({ tipo: 'barrio', nombre: bNombre, padre: comunaNombre })
          for (const sector of barrio.sectores ?? []) {
            rows.push({ tipo: 'barrio', nombre: sector, padre: bNombre })
          }
        }
      }
    }

    for (const corr of ciudad.corregimientos ?? []) {
      const corrNombre = String(corr.nombre ?? '')
      rows.push({ tipo: 'corregimiento', nombre: corrNombre, codigo: String(corr.codigo ?? ''), padre: munNombre })
      for (const vereda of corr.veredas ?? []) {
        rows.push({ tipo: 'vereda', nombre: vereda, padre: corrNombre })
      }
    }
  }

  return rows
}

async function importGeoRows(rows, tenantId, campaignId) {
  const BATCH = 500
  let imported = 0
  const idByName = {}

  function buildPayload(row, parentId) {
    return {
      tenant_id: tenantId, campaign_id: campaignId,
      type: row.tipo.trim().toLowerCase(),
      name: row.nombre.toString().trim(),
      code: row.codigo?.toString().trim() || null,
      parent_id: parentId,
      geojson: null,
      population: row.poblacion ? Number(row.poblacion) || null : null,
    }
  }

  async function insertLevel(levelRows) {
    for (let i = 0; i < levelRows.length; i += BATCH) {
      const batch = levelRows.slice(i, i + BATCH).map(r => {
        const parentId = r.padre ? (idByName[r.padre.toLowerCase()] ?? null) : null
        return buildPayload(r, parentId)
      })
      const { data } = await admin.from('geo_units').insert(batch).select('id, name')
      imported += data?.length ?? 0
      for (const d of data ?? []) idByName[d.name.toLowerCase()] = d.id
    }
  }

  async function fetchExisting(types) {
    for (const type of types) {
      const { data } = await admin.from('geo_units').select('id, name')
        .eq('campaign_id', campaignId).eq('type', type)
      for (const d of data ?? []) idByName[d.name.toLowerCase()] = d.id
    }
  }

  const byType = {}
  for (const row of rows) {
    const t = row.tipo.trim().toLowerCase()
    if (!byType[t]) byType[t] = []
    byType[t].push(row)
  }

  await insertLevel(byType['departamento'] ?? [])
  await fetchExisting(['departamento'])
  await insertLevel(byType['municipio'] ?? [])
  await fetchExisting(['municipio'])
  await insertLevel([...(byType['localidad'] ?? []), ...(byType['comuna'] ?? []), ...(byType['corregimiento'] ?? [])])
  await fetchExisting(['localidad', 'comuna', 'corregimiento'])
  await insertLevel(byType['upz'] ?? [])
  await fetchExisting(['upz'])
  await insertLevel(byType['barrio'] ?? [])
  await insertLevel(byType['vereda'] ?? [])

  return imported
}

// ── Datos para Rionegro ───────────────────────────────────────────────────────
const NOMBRES = [
  'Carlos','Luis','Andrés','Julián','Sebastián','David','Felipe','Alejandro',
  'Jorge','Mauricio','Esteban','Camilo','Daniel','Miguel','Santiago','Juan',
  'María','Daniela','Valentina','Laura','Sofía','Isabella','Lucía','Paula',
  'Natalia','Camila','Andrea','Catalina','Marcela','Diana','Adriana','Ximena',
  'Paola','Claudia','Sandra','Gloria','Patricia','Luz','Martha','Rosa',
]

const APELLIDOS = [
  'García','Martínez','López','González','Rodríguez','Hernández','Pérez',
  'Ramírez','Torres','Vargas','Restrepo','Gómez','Zapata','Aguirre','Mesa',
  'Ríos','Salazar','Cano','Morales','Cardona','Ospina','Mejía','Valencia',
  'Castaño','Sierra','Arango','Vélez','Bedoya','Muñoz','Díaz',
]

const BARRIOS_RIONEGRO = [
  'El Centro','La Presentación','El Porvenir','La Convención','La Macarena',
  'El Estadio','Villa del Río','El Carmelo','La Floresta','Los Ángeles',
  'San Antonio','El Jardín','Villa Sofía','La Candelaria','El Poblado',
  'La Unión','San Marcos','Villa del Este','El Paraíso','La Sierra',
]

const PUESTOS = [
  'IE Técnica Rionegro','IE La Paz','IE La Presentación',
  'INEM José Félix de Restrepo','IE Concejo Municipal',
  'Centro Educativo Yarumito','IE Fray Julio Tobón Betancur',
]

// ── 0. Aplicar migraciones pendientes ────────────────────────────────────────
async function applyPendingMigrations() {
  if (!DB_PASSWORD) {
    console.log('⚠️  DB_PASSWORD no configurado — omitiendo aplicación de migraciones.')
    console.log('   Si faltan tablas, añade DB_PASSWORD=<password> a .env.local')
    console.log('   (Supabase Dashboard → Project Settings → Database → Database password)\n')
    return
  }

  const sql = postgres({
    host: DB_HOST, port: 5432, database: 'postgres',
    username: 'postgres', password: DB_PASSWORD, ssl: 'require',
  })

  const migrationsDir = resolve(__dirname, '../../../supabase/migrations')
  const pending = ['018_geo_units.sql', '019_geo_units_colombia.sql', '020_backfill_tenant_country.sql']

  try {
    for (const file of pending) {
      try {
        const migration = readFileSync(join(migrationsDir, file), 'utf-8')
        await sql.unsafe(migration)
        console.log(`✓ Migración aplicada: ${file}`)
      } catch (err) {
        if (err.message?.includes('already exists') || err.message?.includes('does not exist')) {
          console.log(`  (${file} ya aplicada o no aplica)`)
        } else {
          console.log(`  ⚠️  ${file}: ${err.message.split('\n')[0]}`)
        }
      }
    }
  } finally {
    await sql.end()
  }
}

// ── 1. Limpiar y crear tenant ─────────────────────────────────────────────────
async function setupTenant() {
  console.log('Verificando tenant demo existente...')
  const { data: existing } = await admin.from('tenants').select('id').eq('slug', 'demo').single()

  if (existing) {
    console.log('  Eliminando tenant previo...')
    const tId = existing.id
    const { data: camps } = await admin.from('campaigns').select('id').eq('tenant_id', tId)
    const cIds = (camps || []).map(c => c.id)
    if (cIds.length) {
      for (const tbl of ['canvass_visits','canvass_scripts','territories','contacts','contact_segments','email_campaigns','ai_suggestions','geo_units']) {
        await admin.from(tbl).delete().in('campaign_id', cIds)
      }
      await admin.from('campaigns').delete().in('id', cIds)
    }
    const { data: usersRes } = await admin.auth.admin.listUsers()
    for (const u of (usersRes?.users || [])) {
      if (u.user_metadata?.tenant_id === tId) await admin.auth.admin.deleteUser(u.id)
    }
    await admin.from('profiles').delete().eq('tenant_id', tId)
    await admin.from('tenants').delete().eq('id', tId)
  }

  const { data: tenant, error: tErr } = await admin.from('tenants').insert({
    name: 'Campaña Rionegro Avanza',
    slug: 'demo',
    plan: 'pro',
    settings: { country: 'colombia' },
  }).select().single()
  if (tErr) throw new Error(`Error creando tenant: ${tErr.message}`)
  console.log(`✓ Tenant creado: demo (${tenant.id})`)

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: 'demo@civicos.app',
    password: 'Demo1234!',
    email_confirm: true,
    user_metadata: { full_name: 'Admin Demo', tenant_id: tenant.id, role: 'super_admin' },
  })
  if (authErr) throw new Error(`Error creando usuario: ${authErr.message}`)
  const userId = authData.user.id

  await admin.from('profiles').upsert({
    id: userId,
    tenant_id: tenant.id,
    role: 'super_admin',
    full_name: 'Admin Demo',
    email: 'demo@civicos.app',
    campaign_ids: [],
  })

  const { data: campaign, error: cErr } = await admin.from('campaigns').insert({
    tenant_id: tenant.id,
    name: 'Elecciones Alcaldía Rionegro 2026',
    election_date: '2026-10-25',
    config: {},
    is_active: true,
  }).select().single()
  if (cErr) throw new Error(`Error creando campaña: ${cErr.message}`)

  await admin.from('profiles').update({ campaign_ids: [campaign.id] }).eq('id', userId)
  console.log(`✓ Campaña creada: ${campaign.name} (${campaign.id})`)

  return { tenantId: tenant.id, campaignId: campaign.id, userId }
}

// ── 2. Importar geo data de Colombia ─────────────────────────────────────────
async function importColombia(tenantId, campaignId) {
  // Verificar que la tabla existe primero
  const { error: testErr } = await admin.from('geo_units').select('id').limit(1)
  if (testErr?.code === 'PGRST205') {
    console.log('⚠️  Tabla geo_units no existe. Omitiendo importación geo.')
    console.log('   Para aplicar migraciones, añade DB_PASSWORD a .env.local y re-ejecuta.')
    return
  }

  const jsonPath = join(webDir, 'public', 'geo', 'colombia.json')
  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  const rows = parseColombiaFormat(data)
  const imported = await importGeoRows(rows, tenantId, campaignId)
  console.log(`✓ Geo data Colombia importada (${imported} unidades)`)
}

// ── 3. Canvass script ─────────────────────────────────────────────────────────
async function createScript(tenantId, campaignId, userId) {
  const { data, error } = await admin.from('canvass_scripts').insert({
    tenant_id: tenantId, campaign_id: campaignId,
    name: 'Script Puerta a Puerta — Rionegro 2026',
    description: 'Guión estándar para visitas domiciliarias',
    is_active: true, version: 1, created_by: userId,
    questions: [
      { id: 'q1', type: 'single_choice', text: '¿Conoce al candidato de Rionegro Avanza?',
        options: ['Sí, lo conozco bien', 'Lo he escuchado mencionar', 'No lo conozco'] },
      { id: 'q2', type: 'single_choice', text: '¿Cuál es su principal preocupación en Rionegro?',
        options: ['Seguridad', 'Empleo', 'Educación', 'Infraestructura vial', 'Salud'] },
      { id: 'q3', type: 'single_choice', text: '¿Tiene decidido su voto?',
        options: ['Sí, ya decidí', 'Todavía evaluando', 'No pienso votar'] },
      { id: 'q4', type: 'boolean', text: '¿Le gustaría recibir info por WhatsApp?' },
    ],
  }).select('id').single()
  if (error) throw new Error(`Error creando script: ${error.message}`)
  console.log('✓ Script de canvassing creado')
  return data.id
}

// ── 4. Territorios ────────────────────────────────────────────────────────────
async function createTerritories(tenantId, campaignId, userId) {
  const rows = [
    { name: 'Barrio El Centro',        description: 'Zona céntrica, alta densidad poblacional',      color: '#ef4444', priority: 'alta',  status: 'en_progreso', estimated_contacts: 420 },
    { name: 'Barrio La Presentación',  description: 'Zona residencial, clase media',                 color: '#f97316', priority: 'alta',  status: 'asignado',    estimated_contacts: 310 },
    { name: 'Barrio El Porvenir',      description: 'Sector en crecimiento, muchos nuevos votantes', color: '#eab308', priority: 'media', status: 'disponible',  estimated_contacts: 280 },
    { name: 'Barrio La Convención',    description: 'Zona tradicional, alto porcentaje adulto mayor',color: '#22c55e', priority: 'media', status: 'disponible',  estimated_contacts: 195 },
    { name: 'Corregimiento El Capiro', description: 'Zona rural, veredas y fincas',                 color: '#3b82f6', priority: 'baja',  status: 'disponible',  estimated_contacts: 140 },
  ].map(t => ({ tenant_id: tenantId, campaign_id: campaignId, created_by: userId, ...t }))

  const { data, error } = await admin.from('territories').insert(rows).select('id')
  if (error) throw new Error(`Error creando territorios: ${error.message}`)
  console.log('✓ 5 territorios creados')
  return data.map(d => d.id)
}

// ── 5. Contactos ──────────────────────────────────────────────────────────────
async function createContacts(tenantId, campaignId) {
  const STATUSES = [
    ...Array(35).fill('supporter'),
    ...Array(32).fill('undecided'),
    ...Array(10).fill('opponent'),
    ...Array(3).fill('unknown'),
  ]
  const TAGS_POOL = ['prioridad','vecino_influyente','pendiente_seguimiento','voluntario_potencial','donante']

  const contacts = STATUSES.map((status, i) => {
    const nombre   = NOMBRES[i % NOMBRES.length]
    const apellido1 = rnd(APELLIDOS)
    const apellido2 = rnd(APELLIDOS)
    const isMale   = i % 3 !== 0
    const barrio   = rnd(BARRIOS_RIONEGRO)
    const tags     = Math.random() > 0.6 ? [rnd(TAGS_POOL)] : []
    return {
      tenant_id: tenantId, campaign_id: campaignId,
      first_name:      nombre,
      last_name:       `${apellido1} ${apellido2}`,
      email:           Math.random() > 0.4 ? `${nombre.toLowerCase()}${rndInt(1,99)}@gmail.com` : null,
      phone:           Math.random() > 0.35 ? `3${rndInt(10,29)}${rndInt(1000000,9999999)}` : null,
      address:         `Calle ${rndInt(1,50)} #${rndInt(1,30)}-${rndInt(1,99)}`,
      city:            'Rionegro',
      district:        barrio,
      status,
      tags,
      document_type:   'CC',
      document_number: cc(),
      birth_date:      birthDate(18, 75),
      gender:          isMale ? 'Masculino' : 'Femenino',
      department:      'Antioquia',
      municipality:    'Rionegro',
      commune:         barrio,
      voting_place:    rnd(PUESTOS),
      voting_table:    String(rndInt(1, 20)),
      notes:           Math.random() > 0.7 ? `Contactado por referido en ${barrio}` : null,
    }
  })

  const ids = []
  for (let i = 0; i < contacts.length; i += 20) {
    const { data, error } = await admin.from('contacts').insert(contacts.slice(i, i + 20)).select('id')
    if (error) throw new Error(`Error creando contactos: ${error.message}`)
    ids.push(...data.map(d => d.id))
  }
  console.log('✓ 80 contactos creados')
  return ids
}

// ── 6. Visitas ────────────────────────────────────────────────────────────────
async function createVisits(tenantId, campaignId, contactIds, territoryIds, userId, scriptId) {
  const RESULTS = ['positive','positive','positive','undecided','undecided','no_home','follow_up','negative']
  const visits = contactIds.slice(0, 40).map((contactId, i) => ({
    tenant_id: tenantId, campaign_id: campaignId,
    contact_id:        contactId,
    territory_id:      i < 25 ? territoryIds[0] : territoryIds[1],
    volunteer_id:      userId,
    result:            rnd(RESULTS),
    sympathy_level:    rndInt(1, 5),
    attempt_number:    rndInt(1, 3),
    script_id:         scriptId,
    script_completed:  Math.random() > 0.3,
    wants_to_volunteer: Math.random() > 0.85,
    wants_more_info:   Math.random() > 0.5,
    household_size:    rndInt(1, 6),
    household_voters:  rndInt(1, 4),
    address_confirmed: Math.random() > 0.2,
    status:            'submitted',
    approved_at:       i < 30 ? pastDate(15) : null,
    approved_by:       i < 30 ? userId : null,
    created_at:        pastDate(20),
    notes:             Math.random() > 0.6 ? 'Persona receptiva, mostró interés en propuestas de infraestructura' : null,
  }))

  const { error } = await admin.from('canvass_visits').insert(visits)
  if (error) throw new Error(`Error creando visitas: ${error.message}`)
  console.log('✓ 40 visitas creadas')
}

// ── 7. Segmentos ──────────────────────────────────────────────────────────────
async function createSegments(tenantId, campaignId, userId) {
  const { error } = await admin.from('contact_segments').insert([
    { tenant_id: tenantId, campaign_id: campaignId, created_by: userId,
      name: 'Indecisos activos', description: 'Contactos sin decidir',
      filters: [{ field: 'status', operator: 'eq', value: 'undecided' }] },
    { tenant_id: tenantId, campaign_id: campaignId, created_by: userId,
      name: 'Simpatizantes', description: 'Contactos que apoyan la campaña',
      filters: [{ field: 'status', operator: 'eq', value: 'supporter' }] },
    { tenant_id: tenantId, campaign_id: campaignId, created_by: userId,
      name: 'Alta prioridad', description: 'Contactos marcados para seguimiento urgente',
      filters: [{ field: 'tags', operator: 'contains', value: 'prioridad' }] },
  ])
  if (error) throw new Error(`Error creando segmentos: ${error.message}`)
  console.log('✓ 3 segmentos creados')
}

// ── 8. Email campaigns ────────────────────────────────────────────────────────
async function createEmailCampaigns(tenantId, campaignId, userId) {
  const { error } = await admin.from('email_campaigns').insert([
    {
      tenant_id: tenantId, campaign_id: campaignId, created_by: userId,
      name: 'Bienvenida a la campaña',
      subject: '¡Únete a Rionegro Avanza! Tu voto hace la diferencia',
      body_html: '<h1>¡Bienvenido!</h1><p>Gracias por apoyar nuestra campaña. Juntos transformaremos Rionegro.</p>',
      body_text: '¡Bienvenido! Gracias por apoyar nuestra campaña.',
      status: 'sent', recipient_count: 35, sent_at: pastDate(10),
    },
    {
      tenant_id: tenantId, campaign_id: campaignId, created_by: userId,
      name: 'Evento Parque Santander',
      subject: 'Invitación: Gran evento en el Parque Santander — 28 de marzo',
      body_html: '<h1>Te invitamos</h1><p>Sábado 28 de marzo a las 4pm en el Parque Santander.</p>',
      body_text: 'Sábado 28 de marzo a las 4pm en el Parque Santander.',
      status: 'draft', recipient_count: 0,
    },
  ])
  if (error) throw new Error(`Error creando email campaigns: ${error.message}`)
  console.log('✓ 2 campañas de email creadas')
}

// ── 9. AI Suggestions ─────────────────────────────────────────────────────────
async function createSuggestions(tenantId, campaignId) {
  const { error } = await admin.from('ai_suggestions').insert([
    {
      tenant_id: tenantId, campaign_id: campaignId,
      type: 'data_quality', module: 'crm', priority: 'critical', status: 'active',
      title: '35% de contactos sin teléfono registrado',
      description: 'De los 80 contactos, 28 no tienen número de teléfono. Limita el alcance de SMS y WhatsApp.',
      reasoning: 'Sin teléfono no es posible contactar por canales directos.',
      estimated_impact: 'Recuperar datos de 28 contactos aumentaría el alcance un 35%.',
      agent_id: 'agent-data-quality',
    },
    {
      tenant_id: tenantId, campaign_id: campaignId,
      type: 'canvassing', module: 'canvassing', priority: 'high', status: 'active',
      title: 'Barrio La Presentación sin visitas en 3 días',
      description: 'El territorio tiene 310 contactos estimados pero no ha recibido visitas en 3 días.',
      reasoning: 'La cadencia de visitas se ha detenido. Necesario reasignar voluntarios.',
      estimated_impact: 'Reactivar este territorio podría generar 50-80 visitas esta semana.',
      agent_id: 'agent-territory-monitor',
    },
    {
      tenant_id: tenantId, campaign_id: campaignId,
      type: 'communications', module: 'comunicaciones', priority: 'medium', status: 'active',
      title: 'Campaña "Bienvenida" con 62% tasa de apertura',
      description: 'El email de bienvenida tuvo 62% de apertura vs. 22% promedio del sector.',
      reasoning: 'El asunto resonó muy bien. Replicar el estilo en futuras campañas.',
      estimated_impact: 'Mantener tasas >50% de apertura en comunicaciones.',
      agent_id: 'agent-comms-analyzer',
    },
  ])
  if (error) throw new Error(`Error creando sugerencias: ${error.message}`)
  console.log('✓ 3 sugerencias IA creadas')
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Creando empresa demo — Rionegro Avanza\n')

  try {
    await applyPendingMigrations()
    const { tenantId, campaignId, userId } = await setupTenant()

    await importColombia(tenantId, campaignId)
    const scriptId     = await createScript(tenantId, campaignId, userId)
    const territoryIds = await createTerritories(tenantId, campaignId, userId)
    const contactIds   = await createContacts(tenantId, campaignId)

    await createVisits(tenantId, campaignId, contactIds, territoryIds, userId, scriptId)
    await createSegments(tenantId, campaignId, userId)
    await createEmailCampaigns(tenantId, campaignId, userId)
    await createSuggestions(tenantId, campaignId)

    console.log('\n🎉 Demo lista!')
    console.log('─────────────────────────────────────')
    console.log('   Email:    demo@civicos.app')
    console.log('   Password: Demo1234!')
    console.log('─────────────────────────────────────\n')
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  }
}

main()
