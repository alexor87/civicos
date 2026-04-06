import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/import/contacts/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

import { createClient, createAdminClient } from '@/lib/supabase/server'

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

// Setup admin mock for upsert-based import (no pre-loading of existing contacts)
function setupAdmin(insertedCount?: number) {
  mockAdminSupabase.from = vi.fn().mockImplementation(() => {
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.upsert = vi.fn().mockImplementation((batch: unknown[]) => {
      // Simulate: insertedCount rows actually inserted, rest were duplicates
      const actualInserted = insertedCount !== undefined
        ? batch.slice(0, insertedCount)
        : batch
      return {
        select: vi.fn().mockResolvedValue({ data: actualInserted.map(() => ({ id: 'new-id' })), error: null }),
      }
    })
    return chain
  })
}

function setupAdminCapture(): { getInserted: () => unknown[] } {
  let insertedBatch: unknown[] = []
  mockAdminSupabase.from = vi.fn().mockImplementation(() => {
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.upsert = vi.fn().mockImplementation((batch: unknown[]) => {
      insertedBatch = batch
      return {
        select: vi.fn().mockResolvedValue({ data: batch.map(() => ({ id: 'new-id' })), error: null }),
      }
    })
    return chain
  })
  return { getInserted: () => insertedBatch }
}

describe('POST /api/import/contacts', () => {
  // ── Auth & validation ──────────────────────────────────────────────────

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
    const json = await res.json()
    expect(json.errors).toHaveLength(1)
    expect(json.imported).toBe(0)
  })

  it('counts row as error if last_name is missing', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const res = await POST(makeRequest({ rows: [{ first_name: 'Juan' }] }))
    const json = await res.json()
    expect(json.errors).toHaveLength(1)
    expect(json.imported).toBe(0)
  })

  // ── Deduplication (now handled by DB via ON CONFLICT DO NOTHING) ──────

  it('reports skipped count when DB deduplicates via ON CONFLICT', async () => {
    setupAuth('campaign_manager')
    // Simulate: 2 rows sent, only 1 actually inserted (1 was a duplicate)
    setupAdmin(1)
    const rows = [
      { first_name: 'Juan', last_name: 'García', email: 'juan@example.com' },
      { first_name: 'María', last_name: 'López', email: 'dup@example.com' },
    ]
    const res = await POST(makeRequest({ rows }))
    const json = await res.json()
    expect(json.imported).toBe(1)
    expect(json.skipped).toBe(1)
  })

  it('uses upsert with ignoreDuplicates instead of loading all contacts into memory', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const rows = [
      { first_name: 'Ana', last_name: 'Pérez', email: 'ana@example.com' },
    ]
    await POST(makeRequest({ rows }))
    // Verify upsert was called (not insert)
    const fromCall = mockAdminSupabase.from.mock.results[0]?.value
    expect(fromCall.upsert).toHaveBeenCalled()
  })

  // ── Status normalization ───────────────────────────────────────────────

  it('normalizes invalid status to unknown', async () => {
    setupAuth('super_admin')
    const { getInserted } = setupAdminCapture()
    await POST(makeRequest({ rows: [{ first_name: 'Juan', last_name: 'García', status: 'fan' }] }))
    expect((getInserted()[0] as { status: string }).status).toBe('unknown')
  })

  it('accepts valid status values as-is', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    await POST(makeRequest({ rows: [{ first_name: 'A', last_name: 'B', status: 'supporter' }] }))
    expect((getInserted()[0] as { status: string }).status).toBe('supporter')
  })

  // ── Successful import ──────────────────────────────────────────────────

  it('returns imported count on successful insert', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const rows = [
      { first_name: 'Ana', last_name: 'Pérez', email: 'ana@example.com' },
      { first_name: 'Luis', last_name: 'Martínez', email: 'luis@example.com' },
    ]
    const res = await POST(makeRequest({ rows }))
    const json = await res.json()
    expect(json.imported).toBe(2)
    expect(json.skipped).toBe(0)
    expect(json.errors).toHaveLength(0)
  })

  // ── Spanish header mapping (fallback) ──────────────────────────────────

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

  // ── Colombian fields ──────────────────────────────────────────────────

  it('includes Colombian fields in the insert (only valid DB columns)', async () => {
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
      'BARRIO/VEREDA': 'Alto del medio',
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
    expect(inserted.district).toBe('Alto del medio')
    expect(inserted.commune).toBe('COMUNA 1')
    // referred_by goes into metadata JSONB
    expect((inserted.metadata as Record<string, unknown>).referred_by).toBe('Juan Esteban Ospina')
    // These should NOT exist as direct columns
    expect(inserted.district_barrio).toBeUndefined()
    expect(inserted.referred_by).toBeUndefined()
  })

  it('parses DD/MM/YYYY birth dates correctly', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    await POST(makeRequest({ rows: [{ NOMBRE: 'A', APELLIDO: 'B', 'FECHA DE NACIMIENTO': '24/04/1973' }] }))
    expect((getInserted()[0] as { birth_date: string }).birth_date).toBe('1973-04-24')
  })

  it('parses MM/DD/YYYY dates when day > 12 (e.g. 06/28/1979)', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    await POST(makeRequest({ rows: [{ NOMBRE: 'A', APELLIDO: 'B', 'FECHA DE NACIMIENTO': '06/28/1979' }] }))
    expect((getInserted()[0] as { birth_date: string }).birth_date).toBe('1979-06-28')
  })

  it('parses DD/MM/YYYY dates when day > 12 (e.g. 28/06/1979)', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    await POST(makeRequest({ rows: [{ NOMBRE: 'A', APELLIDO: 'B', 'FECHA DE NACIMIENTO': '28/06/1979' }] }))
    expect((getInserted()[0] as { birth_date: string }).birth_date).toBe('1979-06-28')
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

  it('handles numeric cell values from Excel (e.g. phone as number)', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    const rows = [{ NOMBRE: 'Ana', APELLIDO: 'López', TELEFONO: 3127581793, 'NRO CC': 15438817 }]
    await POST(makeRequest({ rows }))
    const inserted = getInserted()[0] as Record<string, unknown>
    expect(inserted.phone).toBe('3127581793')
    expect(inserted.document_number).toBe('15438817')
  })

  // ── Pre-mapped rows (from column mapper UI) ───────────────────────────

  it('stores metadata fields in metadata JSONB', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    const rows = [{
      first_name: 'Ana', last_name: 'López',
      referred_by: 'Carlos Pérez',
      sector: 'Centro',
      political_affinity: '4',
      vote_intention: 'si',
    }]
    await POST(makeRequest({ rows, preMapped: true }))
    const inserted = getInserted()[0] as Record<string, unknown>
    const meta = inserted.metadata as Record<string, unknown>
    expect(meta.referred_by).toBe('Carlos Pérez')
    expect(meta.sector).toBe('Centro')
    expect(meta.political_affinity).toBe('4')
    expect(meta.vote_intention).toBe('si')
    // These should NOT be direct columns
    expect(inserted.referred_by).toBeUndefined()
    expect(inserted.sector).toBeUndefined()
  })

  it('parses tags as comma-separated array', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    const rows = [{ first_name: 'Ana', last_name: 'López', tags: 'líder, comuna 1, activo' }]
    await POST(makeRequest({ rows, preMapped: true }))
    const inserted = getInserted()[0] as Record<string, unknown>
    expect(inserted.tags).toEqual(['líder', 'comuna 1', 'activo'])
  })

  it('accepts preMapped rows without applying header aliases', async () => {
    setupAuth('campaign_manager')
    const { getInserted } = setupAdminCapture()
    const rows = [{ first_name: 'Ana', last_name: 'López', district: 'Centro', voting_place: 'Coliseo' }]
    await POST(makeRequest({ rows, preMapped: true }))
    const inserted = getInserted()[0] as Record<string, unknown>
    expect(inserted.first_name).toBe('Ana')
    expect(inserted.district).toBe('Centro')
    expect(inserted.voting_place).toBe('Coliseo')
  })
})
