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
  mockAdminTenantsSingle,
  mockAdminCampaignsIn,
  mockSendInviteEmail,
  mockSendAccessGrantedEmail,
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
  mockAdminTenantsSingle:      vi.fn(),
  mockAdminCampaignsIn:        vi.fn(),
  mockSendInviteEmail:         vi.fn(),
  mockSendAccessGrantedEmail:  vi.fn(),
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
      if (table === 'tenants') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockAdminTenantsSingle })),
          })),
        }
      }
      if (table === 'campaigns') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => mockAdminCampaignsIn()),
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
  sendAccessGrantedEmail: mockSendAccessGrantedEmail,
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

  it('does not redirect when generateLink fails with a non-multi-tenant error', async () => {
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
      error: { message: 'Some other auth provider error' },
    })

    const result = await inviteTeamMember(
      makeFormData({ full_name: 'María', email: 'maria@test.com', role: 'volunteer' })
    )
    expect(result).toEqual({ error: 'Some other auth provider error' })
    expect(mockSendInviteEmail).not.toHaveBeenCalled()
  })

  it('returns error when Resend send fails for a brand-new invitee', async () => {
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
    expect(result).toEqual({ error: expect.stringContaining('Domain not verified') })
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

  it('inserts a new tenant_users row, generates a magic-link, sends access-granted email with that link, and returns existing_user=true', async () => {
    setupBaseMocks()
    mockTenantUsersMaybeSingle.mockResolvedValueOnce({ data: null })
    mockTenantUsersInsert.mockResolvedValueOnce({ error: null })
    mockAdminTenantsSingle.mockResolvedValueOnce({ data: { name: 'Jeoz' } })
    mockAdminCampaignsIn.mockResolvedValueOnce({ data: [{ name: 'Campaña Juan Esteban' }] })
    // Second generateLink call (type: 'magiclink') succeeds with a token URL
    mockGenerateLink.mockResolvedValueOnce({
      data: {
        properties: {
          hashed_token: 'magic-token-xyz',
          action_link:  'https://app.scrutix.co/auth/callback?token_hash=magic-token-xyz&type=magiclink&next=/dashboard',
        },
      },
      error: null,
    })
    mockSendAccessGrantedEmail.mockResolvedValueOnce({ ok: true, id: 'msg_1' })

    const result = await promoteContactToMember('contact_id_1', 'volunteer')

    expect(result).toEqual({ existing_user: true })
    expect(mockTenantUsersInsert).toHaveBeenCalledWith({
      user_id:      existingUserId,
      tenant_id:    't_target',
      role:         'volunteer',
      campaign_ids: ['c_target_1'],
    })
    expect(mockTenantUsersUpdate).not.toHaveBeenCalled()
    // generateLink called twice: once for the original invite (failed), once for the magic-link
    expect(mockGenerateLink).toHaveBeenCalledTimes(2)
    expect(mockGenerateLink).toHaveBeenLastCalledWith(expect.objectContaining({
      type:  'magiclink',
      email: 'alexor87@gmail.com',
    }))
    expect(mockSendAccessGrantedEmail).toHaveBeenCalledWith(expect.objectContaining({
      to:            'alexor87@gmail.com',
      inviteeName:   'Alexander Ortiz',
      inviterName:   'Inviter Admin',
      tenantName:    'Jeoz',
      role:          'volunteer',
      campaignNames: ['Campaña Juan Esteban'],
      actionLink:    expect.stringContaining('token_hash=magic-token-xyz'),
    }))
    expect(mockSendInviteEmail).not.toHaveBeenCalled()
  })

  it('updates existing tenant_users row, does NOT send access-granted email (no new info)', async () => {
    setupBaseMocks()
    mockTenantUsersMaybeSingle.mockResolvedValueOnce({
      data: { campaign_ids: ['c_existing'], role: 'volunteer' },
    })
    mockTenantUsersUpdate.mockReturnValueOnce(Promise.resolve({ error: null }))

    const result = await promoteContactToMember('contact_id_1', 'field_coordinator')

    expect(result).toEqual({ existing_user: true })
    expect(mockTenantUsersInsert).not.toHaveBeenCalled()
    expect(mockTenantUsersUpdate).toHaveBeenCalledWith({
      role: 'field_coordinator',
      campaign_ids: expect.arrayContaining(['c_existing', 'c_target_1']),
    })
    expect(mockSendAccessGrantedEmail).not.toHaveBeenCalled()
  })

  it('returns email_failed=true when access-granted email fails, but membership still persists', async () => {
    setupBaseMocks()
    mockTenantUsersMaybeSingle.mockResolvedValueOnce({ data: null })
    mockTenantUsersInsert.mockResolvedValueOnce({ error: null })
    mockAdminTenantsSingle.mockResolvedValueOnce({ data: { name: 'Jeoz' } })
    mockAdminCampaignsIn.mockResolvedValueOnce({ data: [] })
    mockGenerateLink.mockResolvedValueOnce({
      data: { properties: { hashed_token: 't', action_link: 'https://app.scrutix.co/auth/callback?token_hash=t' } },
      error: null,
    })
    mockSendAccessGrantedEmail.mockResolvedValueOnce({ ok: false, error: 'Domain not verified' })

    const result = await promoteContactToMember('contact_id_1', 'volunteer')

    expect(result).toEqual({ existing_user: true, email_failed: true })
    expect(mockTenantUsersInsert).toHaveBeenCalled()
  })

  it('falls back to /dashboard URL when magic-link generation fails (and reports email_failed=true)', async () => {
    setupBaseMocks()
    mockTenantUsersMaybeSingle.mockResolvedValueOnce({ data: null })
    mockTenantUsersInsert.mockResolvedValueOnce({ error: null })
    mockAdminTenantsSingle.mockResolvedValueOnce({ data: { name: 'Jeoz' } })
    mockAdminCampaignsIn.mockResolvedValueOnce({ data: [] })
    // Second generateLink call (magiclink) FAILS
    mockGenerateLink.mockResolvedValueOnce({
      data: null,
      error: { message: 'Auth temporarily unavailable' },
    })
    mockSendAccessGrantedEmail.mockResolvedValueOnce({ ok: true, id: 'msg_3' })

    const result = await promoteContactToMember('contact_id_1', 'volunteer')

    expect(result).toEqual({ existing_user: true, email_failed: true })
    expect(mockTenantUsersInsert).toHaveBeenCalled()
    // Email still sent — but with the fallback /dashboard URL
    expect(mockSendAccessGrantedEmail).toHaveBeenCalledWith(expect.objectContaining({
      actionLink: expect.stringContaining('/dashboard'),
    }))
  })
})

describe('inviteTeamMember — multi-tenant fallback for existing users', () => {
  const callerProfile = {
    tenant_id:    't_target',
    campaign_ids: ['c_target_1'],
    role:         'super_admin',
    full_name:    'Inviter Admin',
  }
  const existingUserId = '69d0fb8e-2060-430a-a5c2-c456853db5b3'

  function setupExistingUserMocks() {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'caller_user' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: callerProfile })
    mockGenerateLink.mockResolvedValueOnce({
      data: null,
      error: { message: 'A user with this email address has already been registered' },
    })
    mockListUsers.mockResolvedValueOnce({
      data: { users: [{ id: existingUserId, email: 'alexor87@gmail.com' }] },
    })
  }

  it('falls back to tenant_users insert + access-granted email with magic-link when invitee already exists', async () => {
    setupExistingUserMocks()
    mockTenantUsersMaybeSingle.mockResolvedValueOnce({ data: null })
    mockTenantUsersInsert.mockResolvedValueOnce({ error: null })
    mockAdminTenantsSingle.mockResolvedValueOnce({ data: { name: 'Jeoz' } })
    mockAdminCampaignsIn.mockResolvedValueOnce({ data: [{ name: 'Campaña Juan Esteban' }] })
    // Magic-link generation succeeds on the second call
    mockGenerateLink.mockResolvedValueOnce({
      data: {
        properties: {
          hashed_token: 'magic-token-abc',
          action_link:  'https://app.scrutix.co/auth/callback?token_hash=magic-token-abc&type=magiclink&next=/dashboard',
        },
      },
      error: null,
    })
    mockSendAccessGrantedEmail.mockResolvedValueOnce({ ok: true, id: 'msg_2' })

    const result = await inviteTeamMember(
      makeFormData({ full_name: 'Alexander Ortiz', email: 'alexor87@gmail.com', role: 'volunteer' })
    )

    expect(result).toEqual({ existing_user: true })
    expect(mockTenantUsersInsert).toHaveBeenCalledWith({
      user_id:      existingUserId,
      tenant_id:    't_target',
      role:         'volunteer',
      campaign_ids: ['c_target_1'],
    })
    expect(mockSendAccessGrantedEmail).toHaveBeenCalledWith(expect.objectContaining({
      to:          'alexor87@gmail.com',
      inviteeName: 'Alexander Ortiz',
      tenantName:  'Jeoz',
      role:        'volunteer',
    }))
    expect(mockSendInviteEmail).not.toHaveBeenCalled()
  })
})
