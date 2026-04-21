import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockCampaignSingle,
  mockGenerateLink,
  mockSendInviteEmail,
} = vi.hoisted(() => ({
  mockGetUser:         vi.fn(),
  mockProfileSingle:   vi.fn(),
  mockCampaignSingle:  vi.fn(),
  mockGenerateLink:    vi.fn(),
  mockSendInviteEmail: vi.fn(),
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
      if (table === 'campaigns') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockCampaignSingle })),
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
        generateLink: mockGenerateLink,
      },
    },
  })),
}))

vi.mock('@/lib/email/transactional', () => ({
  getAppUrl: () => 'https://app.scrutix.co',
  sendInviteEmail: mockSendInviteEmail,
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
  mockGenerateLink.mockResolvedValue({
    data: {
      properties: {
        hashed_token: 'hashed-token-xyz',
        action_link: 'https://app.scrutix.co/auth/callback?token_hash=hashed-token-xyz&type=invite',
      },
    },
    error: null,
  })
  mockCampaignSingle.mockResolvedValue({ data: { name: 'Campaña Bogotá 2026' } })
  mockSendInviteEmail.mockResolvedValue({ ok: true, id: 'msg_1' })
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
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'volunteer', full_name: 'Alex' },
    })
    const result = await inviteTeamMember(makeFormData({ full_name: 'Ana', email: 'ana@test.com', role: 'volunteer' }))
    expect(result).toBeUndefined()
    expect(mockGenerateLink).not.toHaveBeenCalled()
  })

  it('returns without redirect when full_name is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager', full_name: 'Alex' },
    })
    const result = await inviteTeamMember(makeFormData({ full_name: '', email: 'ana@test.com', role: 'volunteer' }))
    expect(result).toBeUndefined()
    expect(mockGenerateLink).not.toHaveBeenCalled()
  })

  it('returns without redirect when email is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager', full_name: 'Alex' },
    })
    const result = await inviteTeamMember(makeFormData({ full_name: 'Ana', email: '', role: 'volunteer' }))
    expect(result).toBeUndefined()
    expect(mockGenerateLink).not.toHaveBeenCalled()
  })

  it('returns without redirect for invalid role', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'super_admin', full_name: 'Alex' },
    })
    const result = await inviteTeamMember(makeFormData({ full_name: 'Ana', email: 'ana@test.com', role: 'super_admin' }))
    expect(result).toBeUndefined()
    expect(mockGenerateLink).not.toHaveBeenCalled()
  })

  it('generates invite link and sends email via Resend', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: {
        tenant_id: 't1',
        campaign_ids: ['c1'],
        role: 'campaign_manager',
        full_name: 'Alexander Ortiz',
      },
    })

    await expect(
      inviteTeamMember(makeFormData({ full_name: 'María López', email: 'maria@test.com', role: 'volunteer' }))
    ).rejects.toThrow('REDIRECT:/dashboard/team')

    expect(mockGenerateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'invite',
        email: 'maria@test.com',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('https://app.scrutix.co'),
          data: expect.objectContaining({ full_name: 'María López', role: 'volunteer' }),
        }),
      })
    )

    expect(mockSendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'maria@test.com',
        inviteeName: 'María López',
        inviterName: 'Alexander Ortiz',
        campaignName: 'Campaña Bogotá 2026',
        role: 'volunteer',
        actionLink: expect.stringContaining('token_hash=hashed-token-xyz'),
      })
    )
  })

  it('does not redirect when generateLink fails', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: {
        tenant_id: 't1',
        campaign_ids: ['c1'],
        role: 'campaign_manager',
        full_name: 'Alex',
      },
    })
    mockGenerateLink.mockResolvedValueOnce({
      data: null,
      error: { message: 'User already been registered' },
    })

    const result = await inviteTeamMember(
      makeFormData({ full_name: 'María', email: 'maria@test.com', role: 'volunteer' })
    )
    expect(result).toBeUndefined()
    expect(mockSendInviteEmail).not.toHaveBeenCalled()
  })

  it('does not redirect when Resend send fails', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: {
        tenant_id: 't1',
        campaign_ids: ['c1'],
        role: 'campaign_manager',
        full_name: 'Alex',
      },
    })
    mockSendInviteEmail.mockResolvedValueOnce({ ok: false, error: 'Domain not verified' })

    const result = await inviteTeamMember(
      makeFormData({ full_name: 'María', email: 'maria@test.com', role: 'volunteer' })
    )
    expect(result).toBeUndefined()
  })

  it('falls back to "tu campaña" when profile has no campaigns', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: {
        tenant_id: 't1',
        campaign_ids: [],
        role: 'campaign_manager',
        full_name: 'Alex',
      },
    })

    await expect(
      inviteTeamMember(makeFormData({ full_name: 'María', email: 'maria@test.com', role: 'volunteer' }))
    ).rejects.toThrow('REDIRECT:/dashboard/team')

    expect(mockCampaignSingle).not.toHaveBeenCalled()
    expect(mockSendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({ campaignName: 'tu campaña' })
    )
  })
})
