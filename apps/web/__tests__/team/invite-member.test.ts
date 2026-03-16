import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const { mockGetUser, mockProfileSingle, mockInviteByEmail } = vi.hoisted(() => ({
  mockGetUser:        vi.fn(),
  mockProfileSingle:  vi.fn(),
  mockInviteByEmail:  vi.fn(),
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
      return {}
    }),
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        inviteUserByEmail: mockInviteByEmail,
      },
    },
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

import { inviteTeamMember } from '@/app/dashboard/team/actions'

function makeFormData(data: Record<string, string>) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => fd.append(k, v))
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  mockInviteByEmail.mockResolvedValue({ error: null })
})

describe('inviteTeamMember', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(
      inviteTeamMember(makeFormData({ full_name: 'Ana', email: 'ana@test.com', role: 'volunteer' }))
    ).rejects.toThrow('REDIRECT:/login')
  })

  it('returns without redirect when user is not an admin/manager', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'volunteer' },
    })
    const result = await inviteTeamMember(makeFormData({ full_name: 'Ana', email: 'ana@test.com', role: 'volunteer' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect when full_name is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    const result = await inviteTeamMember(makeFormData({ full_name: '', email: 'ana@test.com', role: 'volunteer' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect when email is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    const result = await inviteTeamMember(makeFormData({ full_name: 'Ana', email: '', role: 'volunteer' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect for invalid role', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'super_admin' },
    })
    const result = await inviteTeamMember(makeFormData({ full_name: 'Ana', email: 'ana@test.com', role: 'super_admin' }))
    expect(result).toBeUndefined()
  })

  it('invites via email and redirects to team page', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    await expect(
      inviteTeamMember(makeFormData({ full_name: 'María López', email: 'maria@test.com', role: 'volunteer' }))
    ).rejects.toThrow('REDIRECT:/dashboard/team')
    expect(mockInviteByEmail).toHaveBeenCalledWith(
      'maria@test.com',
      expect.objectContaining({
        data: expect.objectContaining({ full_name: 'María López', role: 'volunteer' }),
      })
    )
  })
})
