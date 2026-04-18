import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

import { POST } from '@/app/api/contacts/merge/route'

function makeRequest(body: object): Request {
  return new Request('http://localhost/api/contacts/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const TARGET_CONTACT = {
  id: 'target-id',
  first_name: 'Juan',
  last_name: 'García',
  phone: '3101234567',
  email: null,
  document_type: 'CC',
  document_number: '123456',
  address: 'Calle 1',
  department: 'Antioquia',
  municipality: 'Rionegro',
  commune: null,
  district: null,
  city: 'Rionegro',
  voting_place: null,
  voting_table: null,
  birth_date: null,
  gender: null,
  location_lat: null,
  location_lng: null,
  geocoding_status: 'pending',
  contact_level: 'completo',
  status: 'supporter',
  tags: ['tag1'],
  metadata: { political_affinity: 'centro' },
  notes: 'Nota original',
}

const SOURCE_CONTACT = {
  id: 'source-id',
  first_name: 'Carlos',
  last_name: 'Gómez',
  phone: '3209876543',
  email: 'carlos@test.com',
  document_type: null,
  document_number: null,
  address: null,
  department: null,
  municipality: null,
  commune: 'Comuna 1',
  district: 'Barrio Norte',
  city: null,
  voting_place: 'Escuela Central',
  voting_table: 'Mesa 3',
  birth_date: '1990-05-15',
  gender: 'male',
  location_lat: 6.04,
  location_lng: -75.55,
  geocoding_status: 'manual_pin',
  contact_level: 'opinion',
  status: 'unknown',
  tags: ['tag2', 'tag1'],
  metadata: { vote_intention: 'a_favor' },
  notes: 'Nota del source',
}

function setupProfileMock() {
  return {
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({
          data: { campaign_ids: ['camp-1'] },
        }),
      }),
    }),
  }
}

function setupContactsMock(contacts: object[]) {
  return {
    select: () => ({
      eq: () => ({
        is: () => ({
          in: () => Promise.resolve({ data: contacts }),
        }),
      }),
    }),
  }
}

describe('POST /api/contacts/merge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ sourceId: 'a', targetId: 'b' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when no campaign', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null }),
        }),
      }),
    })

    const res = await POST(makeRequest({ sourceId: 'a', targetId: 'b' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when sourceId equals targetId', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return setupProfileMock()
      return {}
    })

    const res = await POST(makeRequest({ sourceId: 'same-id', targetId: 'same-id' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when ids are missing', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return setupProfileMock()
      return {}
    })

    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 404 when contacts not found', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return setupProfileMock()
      if (table === 'contacts') return setupContactsMock([])
      return {}
    })

    const res = await POST(makeRequest({ sourceId: 'a', targetId: 'b' }))
    expect(res.status).toBe(404)
  })

  it('merges contacts successfully — fills gaps from source', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    })

    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return setupProfileMock()
      if (table === 'contacts') {
        callCount++
        // First call: select both contacts
        if (callCount === 1) return setupContactsMock([TARGET_CONTACT, SOURCE_CONTACT])
        // Second call: update target
        if (callCount === 2) return { update: mockUpdate }
        // Third call: soft-delete source
        if (callCount === 3) return { update: mockUpdate }
      }
      return {}
    })

    const res = await POST(makeRequest({ sourceId: 'source-id', targetId: 'target-id' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.mergedId).toBe('target-id')

    // Verify update was called (merge + soft-delete = 2 calls)
    expect(mockUpdate).toHaveBeenCalledTimes(2)

    // First call: merge update — fills null fields from source
    const mergeData = mockUpdate.mock.calls[0][0]
    expect(mergeData.email).toBe('carlos@test.com') // target was null
    expect(mergeData.commune).toBe('Comuna 1')
    expect(mergeData.district).toBe('Barrio Norte')
    expect(mergeData.voting_place).toBe('Escuela Central')
    expect(mergeData.voting_table).toBe('Mesa 3')
    expect(mergeData.birth_date).toBe('1990-05-15')
    expect(mergeData.gender).toBe('male')
    expect(mergeData.location_lat).toBe(6.04)
    expect(mergeData.location_lng).toBe(-75.55)

    // Tags: union without duplicates
    expect(mergeData.tags).toEqual(expect.arrayContaining(['tag1', 'tag2']))
    expect(mergeData.tags.length).toBe(2)

    // Metadata: deep merge (source base, target overwrites)
    expect(mergeData.metadata.political_affinity).toBe('centro') // from target
    expect(mergeData.metadata.vote_intention).toBe('a_favor') // from source

    // Notes: concatenated
    expect(mergeData.notes).toContain('Nota original')
    expect(mergeData.notes).toContain('Nota del source')

    // Second call: soft-delete source
    const deleteData = mockUpdate.mock.calls[1][0]
    expect(deleteData.deleted_at).toBeDefined()
  })

  it('does not update target when source has no extra data', async () => {
    const emptySource = {
      ...SOURCE_CONTACT,
      email: null,
      commune: null,
      district: null,
      voting_place: null,
      voting_table: null,
      birth_date: null,
      gender: null,
      location_lat: null,
      location_lng: null,
      tags: [],
      metadata: {},
      notes: null,
      contact_level: 'opinion',
    }

    const mockUpdate = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    })

    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return setupProfileMock()
      if (table === 'contacts') {
        callCount++
        if (callCount === 1) return setupContactsMock([TARGET_CONTACT, emptySource])
        return { update: mockUpdate }
      }
      return {}
    })

    const res = await POST(makeRequest({ sourceId: 'source-id', targetId: 'target-id' }))
    expect(res.status).toBe(200)

    // Only soft-delete call, no merge update (target already has everything)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    const deleteData = mockUpdate.mock.calls[0][0]
    expect(deleteData.deleted_at).toBeDefined()
  })

  it('upgrades contact_level when source is higher', async () => {
    const lowTarget = { ...TARGET_CONTACT, contact_level: 'opinion' }

    const mockUpdate = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    })

    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return setupProfileMock()
      if (table === 'contacts') {
        callCount++
        if (callCount === 1) {
          return setupContactsMock([
            lowTarget,
            { ...SOURCE_CONTACT, contact_level: 'completo' },
          ])
        }
        return { update: mockUpdate }
      }
      return {}
    })

    const res = await POST(makeRequest({ sourceId: 'source-id', targetId: 'target-id' }))
    expect(res.status).toBe(200)

    const mergeData = mockUpdate.mock.calls[0][0]
    expect(mergeData.contact_level).toBe('completo')
  })
})
