import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks so they're available before module imports ────────────────────
const { mockGetUser, mockProfileSingle, mockInsertSingle, mockDeleteEq, mockSegmentSingle, mockGetActiveCampaignContext } = vi.hoisted(() => ({
  mockGetUser:       vi.fn(),
  mockProfileSingle: vi.fn(),
  mockInsertSingle:  vi.fn(),
  mockDeleteEq:      vi.fn(),
  mockSegmentSingle: vi.fn(),
  mockGetActiveCampaignContext: vi.fn(),
}))

vi.mock('@/lib/auth/active-campaign-context', () => ({
  getActiveCampaignContext: mockGetActiveCampaignContext,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockProfileSingle })),
          })),
        }
      }
      if (table === 'contact_segments') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({ single: mockInsertSingle })),
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockSegmentSingle })),
          })),
          delete: vi.fn(() => ({ eq: mockDeleteEq })),
        }
      }
      return {}
    }),
  })),
}))

// ── next/navigation mock ──────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

import { createSegment, deleteSegment } from '@/app/dashboard/contacts/segments/actions'

function makeFormData(data: Record<string, string>) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => fd.append(k, v))
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  mockInsertSingle.mockResolvedValue({ data: { id: 'seg-1' }, error: null })
  mockDeleteEq.mockResolvedValue({ error: null })
  mockGetActiveCampaignContext.mockResolvedValue({
    activeTenantId:   't1',
    campaignIds:      ['c1'],
    activeCampaignId: 'c1',
    role:             'campaign_manager',
    customRoleId:     null,
  })
})

describe('createSegment', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(
      createSegment(makeFormData({ name: 'Test', filters: '[]' }))
    ).rejects.toThrow('REDIRECT:/login')
  })

  it('returns without redirect when name is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', campaign_ids: ['c1'] } })
    const result = await createSegment(makeFormData({ name: '', filters: '[]' }))
    expect(result).toBeUndefined()
  })

  it('creates segment and redirects to detail page', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', campaign_ids: ['c1'] } })
    await expect(
      createSegment(makeFormData({ name: 'Simpatizantes', filters: '[{"field":"status","operator":"eq","value":"supporter"}]' }))
    ).rejects.toThrow('REDIRECT:/dashboard/contacts/segments/seg-1')
  })

  it('handles malformed filters JSON gracefully', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', campaign_ids: ['c1'] } })
    // Should not throw, falls back to []
    await expect(
      createSegment(makeFormData({ name: 'Test', filters: 'INVALID_JSON' }))
    ).rejects.toThrow('REDIRECT:/dashboard/contacts/segments/seg-1')
  })
})

describe('deleteSegment', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(deleteSegment('seg-1')).rejects.toThrow('REDIRECT:/login')
  })

  it('deletes and redirects to segments list', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { campaign_ids: ['c1'] } })
    mockSegmentSingle.mockResolvedValueOnce({ data: { campaign_id: 'c1' } })
    await expect(deleteSegment('seg-1')).rejects.toThrow('REDIRECT:/dashboard/contacts/segments')
  })
})
