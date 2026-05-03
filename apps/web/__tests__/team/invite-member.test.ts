import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockCampaignSingle,
  mockContactSingle,
  mockGenerateLink,
  mockListUsers,
  mockTenantUsersMaybeSingle,
  mockTenantUsersInsert,
  mockTenantUsersUpdate,
  mockSendInviteEmail,
} = vi.hoisted(() => ({
  mockGetUser:                 vi.fn(),
  mockProfileSingle:           vi.fn(),
  mockCampaignSingle:          vi.fn(),
  mockContactSingle:           vi.fn(),
  mockGenerateLink:            vi.fn(),
  mockListUsers:               vi.fn(),
  mockTenantUsersMaybeSingle:  vi.fn(),
  mockTenantUsersInsert:       vi.fn(),
  mockTenantUsersUpdate:       vi.fn(),
  mockSendInviteEmail:         vi.fn(),
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
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({ single: mockContactSingle })),
            })),
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
        listUsers:    mockListUsers,
      },
    },
    from: vi.fn((table: string) => {
      if (table === 'tenant_users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ maybeSingle: mockTenantUsersMaybeSingle })),
            })),
          })),
          insert: mockTenantUsersInsert,
          update: vi.fn((payload: Record<string, unknown>) => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => mockTenantUsersUpdate(payload)),
            })),
          })),
        }
      }
      return {}
    }),
  })),
}))

vi.mock('@/lib/email/transactional', () => ({
  getAppUrl: () => 'https://app.scrutix.co',
  sendInviteEmail: mockSendInviteEmail,
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

import { inviteTeamMember, promoteContactToMember } from '@/app/dashboard/team/actions'

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

describe('promoteContactToMember — multi-tenant', () => {
  const callerProfile = {
    tenant_id: 't_target',
    campaign_ids: ['c_target_1'],
    role: 'super_admin',
    full_name: 'Inviter Admin',
  }
  const existingContact = {
    first_name: 'Alexander',
    last_name: 'Ortiz',
    email: 'alexor87@gmail.com',
    phone: '573004941054',
  }
  const existingUserId = '69d0fb8e-2060-430a-a5c2-c456853db5b3'

  function setupBaseMocks() {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'caller_user' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: callerProfile })
    mockContactSingle.mockResolvedValueOnce({ data: existingContact })
    // generateLink returns the "already registered" error to force the multi-tenant branch
    mockGenerateLink.mockResolvedValueOnce({
      data: null,
      error: { message: 'A user with this email address has already been registered' },
    })
    mockListUsers.mockResolvedValueOnce({
      data: { users: [{ id: existingUserId, email: existingContact.email }] },
    })
  }

  it('inserts a new tenant_users row when the user belongs to a different tenant (no error returned)', async () => {
    setupBaseMocks()
    // No existing membership in the target tenant
    mockTenantUsersMaybeSingle.mockResolvedValueOnce({ data: null })
    mockTenantUsersInsert.mockResolvedValueOnce({ error: null })

    const result = await promoteContactToMember('contact_id_1', 'volunteer')

    expect(result).toEqual({})
    expect(result.error).toBeUndefined()
    expect(mockTenantUsersInsert).toHaveBeenCalledWith({
      user_id:      existingUserId,
      tenant_id:    't_target',
      role:         'volunteer',
      campaign_ids: ['c_target_1'],
    })
    expect(mockTenantUsersUpdate).not.toHaveBeenCalled()
  })

  it('updates the existing tenant_users row when the user is already in the same tenant (merges campaigns, no insert)', async () => {
    setupBaseMocks()
    // Existing membership with another campaign_id already attached
    mockTenantUsersMaybeSingle.mockResolvedValueOnce({
      data: { campaign_ids: ['c_existing'], role: 'volunteer' },
    })
    mockTenantUsersUpdate.mockReturnValueOnce(Promise.resolve({ error: null }))

    const result = await promoteContactToMember('contact_id_1', 'field_coordinator')

    expect(result).toEqual({})
    expect(mockTenantUsersInsert).not.toHaveBeenCalled()
    expect(mockTenantUsersUpdate).toHaveBeenCalledWith({
      role: 'field_coordinator',
      campaign_ids: expect.arrayContaining(['c_existing', 'c_target_1']),
    })
  })
})
