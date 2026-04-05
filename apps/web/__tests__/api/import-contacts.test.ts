import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/import/contacts/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

import { createClient, createAdminClient } from '@/lib/supabase/server'

// Helper to build mock Supabase chain
function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {}
  chain.from = vi.fn().mockReturnValue(chain)
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(result)
  chain.insert = vi.fn().mockResolvedValue({ error: null })
  // Make the chain itself awaitable (for queries without .single())
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve().then(() => resolve(result))
  return chain
}

const mockUserSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}

const mockAdminSupabase = {
  from: vi.fn(),
}

beforeEach(() => {
  vi.resetAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserSupabase)
  ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminSupabase)
})

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/import/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Setup authenticated user with a given role
function setupAuth(role: string) {
  mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  const profileChain: Record<string, unknown> = {}
  profileChain.select = vi.fn().mockReturnValue(profileChain)
  profileChain.eq = vi.fn().mockReturnValue(profileChain)
  profileChain.single = vi.fn().mockResolvedValue({
    data: { tenant_id: 't1', campaign_ids: ['c1'], role },
  })
  mockUserSupabase.from = vi.fn().mockReturnValue(profileChain)
}

// Setup admin client: no existing contacts by default
function setupAdmin(existingContacts: { email?: string | null; phone?: string | null; document_number?: string | null }[] = []) {
  let callCount = 0
  mockAdminSupabase.from = vi.fn().mockImplementation(() => {
    callCount++
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.insert = vi.fn().mockResolvedValue({ error: null })
    // First call is the dedup query (.select.eq → awaitable)
    // Subsequent calls are inserts
    if (callCount === 1) {
      chain.then = (resolve: (v: { data: typeof existingContacts }) => void) =>
        Promise.resolve().then(() => resolve({ data: existingContacts }))
    } else {
      chain.then = (resolve: (v: { error: null }) => void) =>
        Promise.resolve().then(() => resolve({ error: null }))
    }
    return chain
  })
}

// Helper: setup admin mock that captures the inserted batch
function setupAdminCapture(): { getInserted: () => unknown[] } {
  let insertedBatch: unknown[] = []
  mockAdminSupabase.from = vi.fn().mockImplementation(() => {
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.insert = vi.fn().mockImplementation((batch: unknown[]) => {
      insertedBatch = batch
      return Promise.resolve({ error: null })
    })
    chain.then = (resolve: (v: { data: [] }) => void) =>
      Promise.resolve().then(() => resolve({ data: [] }))
    return chain
  })
  return { getInserted: () => insertedBatch }
}

describe('POST /api/import/contacts', () => {
  it('returns 401 if not authenticated', async () => {
    mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ rows: [] }))
    expect(res.status).toBe(401)
  })

  it('returns 403 if role is volunteer', async () => {
    setupAuth('volunteer')
    const res = await POST(makeRequest({ rows: [{ first_name: 'A', last_name: 'B' }] }))
    expect(res.status).toBe(403)
  })

  it('returns 403 if role is analyst', async () => {
    setupAuth('analyst')
    const res = await POST(makeRequest({ rows: [{ first_name: 'A', last_name: 'B' }] }))
    expect(res.status).toBe(403)
  })

  it('returns 400 if rows is empty', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const res = await POST(makeRequest({ rows: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 if rows is missing', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('counts row as error if first_name is missing', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const res = await POST(makeRequest({ rows: [{ last_name: 'García' }] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.errors).toHaveLength(1)
    expect(json.imported).toBe(0)
  })

  it('counts row as error if last_name is missing', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const res = await POST(makeRequest({ rows: [{ first_name: 'Juan' }] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.errors).toHaveLength(1)
    expect(json.imported).toBe(0)
  })

  it('skips row with duplicate email (already in DB)', async () => {
    setupAuth('campaign_manager')
    setupAdmin([{ email: 'juan@example.com', phone: null }])
    const res = await POST(makeRequest({ rows: [{ first_name: 'Juan', last_name: 'García', email: 'juan@example.com' }] }))
    const json = await res.json()
    expect(json.skipped).toBe(1)
    expect(json.imported).toBe(0)
  })

  it('skips row with duplicate phone (already in DB)', async () => {
    setupAuth('campaign_manager')
    setupAdmin([{ email: null, phone: '5551234567' }])
    const res = await POST(makeRequest({ rows: [{ first_name: 'Juan', last_name: 'García', phone: '555-123-4567' }] }))
    const json = await res.json()
    expect(json.skipped).toBe(1)
    expect(json.imported).toBe(0)
  })

  it('deduplicates within the same batch (two rows same email)', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const rows = [
      { first_name: 'Juan', last_name: 'García', email: 'dup@example.com' },
      { first_name: 'María', last_name: 'López', email: 'dup@example.com' },
    ]
    const res = await POST(makeRequest({ rows }))
    const json = await res.json()
    expect(json.imported).toBe(1)
    expect(json.skipped).toBe(1)
  })

  it('normalizes invalid status to unknown', async () => {
    setupAuth('super_admin')
    const { getInserted } = setupAdminCapture()
    await POST(makeRequest({ rows: [{ first_name: 'Juan', last_name: 'García', status: 'fan' }] }))
    expect((getInserted()[0] as { status: string }).status).toBe('unknown')
  })

  it('returns imported count on successful insert', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const rows = [
      { first_name: 'Ana', last_name: 'Pérez', email: 'ana@example.com' },
      { first_name: 'Luis', last_name: 'Martínez', email: 'luis@example.com' },
    ]
    const res = await POST(makeRequest({ rows }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.imported).toBe(2)
    expect(json.skipped).toBe(0)
    expect(json.errors).toHaveLength(0)
  })

  it('accepts valid status values as-is', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    await POST(makeRequest({ rows: [{ first_name: 'A', last_name: 'B', status: 'supporter' }] }))
    expect((getInserted()[0] as { status: string }).status).toBe('supporter')
  })

  // ── Spanish header mapping ───────────────────────────────────────────────

  it('maps Spanish headers (NOMBRE, APELLIDO) to internal fields', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const rows = [{ NOMBRE: 'Cesar', APELLIDO: 'Gomez', TELEFONO: '3127581793' }]
    const res = await POST(makeRequest({ rows }))
    const json = await res.json()
    expect(json.imported).toBe(1)
    expect(json.errors).toHaveLength(0)
  })

  it('maps headers case-insensitively', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const rows = [{ nombre: 'Ana', Apellido: 'López' }]
    const res = await POST(makeRequest({ rows }))
    const json = await res.json()
    expect(json.imported).toBe(1)
  })

  it('maps CORREO ELECTRONICO to email', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    const rows = [{ NOMBRE: 'Ana', APELLIDO: 'López', 'CORREO ELECTRONICO': 'Ana@Test.COM' }]
    await POST(makeRequest({ rows }))
    expect((getInserted()[0] as { email: string }).email).toBe('ana@test.com')
  })

  it('ignores unknown headers without error', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const rows = [{ NOMBRE: 'Ana', APELLIDO: 'López', ITEM: '1', UNKNOWN_COL: 'xyz' }]
    const res = await POST(makeRequest({ rows }))
    const json = await res.json()
    expect(json.imported).toBe(1)
    expect(json.errors).toHaveLength(0)
  })

  // ── Colombian fields ─────────────────────────────────────────────────────

  it('includes Colombian fields in the insert payload', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    const rows = [{
      NOMBRE: 'Cesar',
      APELLIDO: 'Holt',
      'NRO CC': '15438817',
      'PUESTO DE VOTACION': 'Coliseo Ivan Ramiro Cordoba',
      'MESA DE': '1',
      'FECHA DE NACIMIENTO': '07/11/1975',
      TELEFONO: '3127581793',
      'CORREO ELECTRONICO': 'cesar@test.com',
      DIRECCION: 'Calle 54#5231',
      'BARRIO/VEREDA': 'Calle 54#5231',
      'NOMBRE DE LIDER/REFERIDO': 'Juan Esteban Ospina',
      ORIGEN: 'COMUNA 1',
    }]
    await POST(makeRequest({ rows }))
    const inserted = getInserted()[0] as Record<string, unknown>
    expect(inserted.first_name).toBe('Cesar')
    expect(inserted.last_name).toBe('Holt')
    expect(inserted.document_number).toBe('15438817')
    expect(inserted.voting_place).toBe('Coliseo Ivan Ramiro Cordoba')
    expect(inserted.voting_table).toBe('1')
    expect(inserted.birth_date).toBe('1975-11-07')
    expect(inserted.phone).toBe('3127581793')
    expect(inserted.email).toBe('cesar@test.com')
    expect(inserted.address).toBe('Calle 54#5231')
    expect(inserted.district_barrio).toBe('Calle 54#5231')
    expect(inserted.referred_by).toBe('Juan Esteban Ospina')
    expect(inserted.commune).toBe('COMUNA 1')
  })

  it('parses DD/MM/YYYY birth dates correctly', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    await POST(makeRequest({ rows: [{ NOMBRE: 'A', APELLIDO: 'B', 'FECHA DE NACIMIENTO': '24/04/1973' }] }))
    expect((getInserted()[0] as { birth_date: string }).birth_date).toBe('1973-04-24')
  })

  it('passes through ISO dates', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    await POST(makeRequest({ rows: [{ NOMBRE: 'A', APELLIDO: 'B', birth_date: '1990-06-15' }] }))
    expect((getInserted()[0] as { birth_date: string }).birth_date).toBe('1990-06-15')
  })

  it('sets birth_date to null for invalid dates', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    await POST(makeRequest({ rows: [{ NOMBRE: 'A', APELLIDO: 'B', 'FECHA DE NACIMIENTO': 'not-a-date' }] }))
    expect((getInserted()[0] as { birth_date: null }).birth_date).toBeNull()
  })

  it('deduplicates by document_number', async () => {
    setupAuth('campaign_manager')
    setupAdmin([{ email: null, phone: null, document_number: '15438817' }])
    const rows = [{ NOMBRE: 'Cesar', APELLIDO: 'Holt', 'NRO CC': '15438817' }]
    const res = await POST(makeRequest({ rows }))
    const json = await res.json()
    expect(json.skipped).toBe(1)
    expect(json.imported).toBe(0)
  })

  it('handles numeric cell values from Excel (e.g. phone as number)', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    // Excel sometimes parses phone/document_number as numbers
    const rows = [{ NOMBRE: 'Ana', APELLIDO: 'López', TELEFONO: 3127581793, 'NRO CC': 15438817 }]
    await POST(makeRequest({ rows }))
    const inserted = getInserted()[0] as Record<string, unknown>
    expect(inserted.phone).toBe('3127581793')
    expect(inserted.document_number).toBe('15438817')
  })
})
