import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetUser,
  mockProfileSelect,
  mockCampaignSelect,
  mockContactsTotal,
  mockContactsSupporters,
  mockContactsOpponents,
  mockContactsUndecided,
  mockVisitsTotal,
  mockVisitRows,
  mockContactStatus,
  mockEmailReach,
  mockSmsReach,
  mockActiveVols,
  mockAllVisits,
  mockContactsDept,
  mockVolProfiles,
} = vi.hoisted(() => ({
  mockGetUser:            vi.fn(),
  mockProfileSelect:      vi.fn(),
  mockCampaignSelect:     vi.fn(),
  mockContactsTotal:      vi.fn(),
  mockContactsSupporters: vi.fn(),
  mockContactsOpponents:  vi.fn(),
  mockContactsUndecided:  vi.fn(),
  mockVisitsTotal:        vi.fn(),
  mockVisitRows:          vi.fn(),
  mockContactStatus:      vi.fn(),
  mockEmailReach:         vi.fn(),
  mockSmsReach:           vi.fn(),
  mockActiveVols:         vi.fn(),
  mockAllVisits:          vi.fn(),
  mockContactsDept:       vi.fn(),
  mockVolProfiles:        vi.fn(),
}))

function makeChain(terminalFn: ReturnType<typeof vi.fn>) {
  const chain: Record<string, unknown> = {}
  const methods = ['eq', 'not', 'in', 'gte', 'order', 'select', 'single', 'limit']
  for (const m of methods) { chain[m] = vi.fn(() => chain) }
  chain.then = vi.fn((resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    terminalFn().then(resolve, reject)
  )
  return chain
}

let contactsCallCount = 0
let visitsCallCount   = 0
let emailCallCount    = 0

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockProfileSelect })),
            in: vi.fn(() => mockVolProfiles()),
          })),
        }
      }
      if (table === 'campaigns') {
        return { select: vi.fn(() => makeChain(mockCampaignSelect)) }
      }
      if (table === 'contacts') {
        contactsCallCount++
        const fns = [mockContactsTotal, mockContactsSupporters, mockContactsOpponents, mockContactsUndecided, mockContactStatus, mockContactsDept]
        const fn = fns[(contactsCallCount - 1) % fns.length] ?? mockContactsTotal
        return { select: vi.fn(() => makeChain(fn)) }
      }
      if (table === 'canvass_visits') {
        visitsCallCount++
        const fns = [mockVisitsTotal, mockVisitRows, mockActiveVols, mockAllVisits]
        const fn = fns[(visitsCallCount - 1) % fns.length] ?? mockVisitsTotal
        return { select: vi.fn(() => makeChain(fn)) }
      }
      if (table === 'email_campaigns') {
        return { select: vi.fn(() => makeChain(mockEmailReach)) }
      }
      if (table === 'sms_campaigns') {
        return { select: vi.fn(() => makeChain(mockSmsReach)) }
      }
      if (table === 'territories') {
        return { select: vi.fn(() => makeChain(() => Promise.resolve({ data: [] }))) }
      }
      return {}
    }),
  })),
}))

import { GET } from '@/app/api/export/reportes/route'

function makeRequest() {
  return new NextRequest('http://localhost/api/export/reportes', { method: 'GET' })
}

function mockDefaults() {
  mockCampaignSelect.mockResolvedValue({ data: { name: 'Prueba', election_date: '2026-10-25' } })
  mockContactsTotal.mockResolvedValue({ count: 100 })
  mockContactsSupporters.mockResolvedValue({ count: 45 })
  mockContactsOpponents.mockResolvedValue({ count: 10 })
  mockContactsUndecided.mockResolvedValue({ count: 30 })
  mockContactStatus.mockResolvedValue({ data: [{ status: 'supporter' }, { status: 'undecided' }] })
  mockContactsDept.mockResolvedValue({ data: [{ department: 'Antioquia' }] })
  mockVisitsTotal.mockResolvedValue({ count: 60 })
  mockVisitRows.mockResolvedValue({ data: [{ created_at: new Date().toISOString(), result: 'positive' }] })
  mockActiveVols.mockResolvedValue({ data: [{ volunteer_id: 'u1' }] })
  mockAllVisits.mockResolvedValue({ data: [{ volunteer_id: 'u1', territory_id: 't1', territories: { name: 'Centro' } }] })
  mockEmailReach.mockResolvedValue({ data: [{ recipient_count: 50 }] })
  mockSmsReach.mockResolvedValue({ data: [{ recipient_count: 30 }] })
  mockVolProfiles.mockResolvedValue({ data: [{ id: 'u1', full_name: 'Carlos García' }] })
}

beforeEach(() => {
  vi.clearAllMocks()
  contactsCallCount = 0
  visitsCallCount   = 0
  emailCallCount    = 0
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockProfileSelect.mockResolvedValue({ data: null })
})

describe('GET /api/export/reportes', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 400 when user has no campaign', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [] } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
  })

  it('returns xlsx file with correct content-type', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: ['camp1'] } })
    mockDefaults()
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('spreadsheetml.sheet')
  })

  it('sets Content-Disposition with filename', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: ['camp1'] } })
    mockDefaults()
    const res = await GET(makeRequest())
    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition).toContain('attachment')
    expect(disposition).toContain('.xlsx')
  })

  it('returns a non-empty buffer', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: ['camp1'] } })
    mockDefaults()
    const res = await GET(makeRequest())
    const buf = await res.arrayBuffer()
    expect(buf.byteLength).toBeGreaterThan(0)
  })
})
