import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockInsert,
  mockCampaignSingle,
  mockUpdate,
  mockDelete,
  mockSegmentSingle,
  mockContactsQuery,
  mockResendSend,
  mockGetActiveCampaignContext,
} = vi.hoisted(() => ({
  mockGetUser:       vi.fn(),
  mockProfileSingle: vi.fn(),
  mockInsert:        vi.fn(),
  mockCampaignSingle: vi.fn(),
  mockUpdate:        vi.fn(),
  mockDelete:        vi.fn(),
  mockSegmentSingle: vi.fn(),
  mockContactsQuery: vi.fn(),
  mockResendSend:    vi.fn(),
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
      if (table === 'email_campaigns') {
        return {
          insert:  vi.fn(() => ({ select: vi.fn(() => ({ single: mockInsert })) })),
          select:  vi.fn(() => ({ eq: vi.fn(() => ({ single: mockCampaignSingle })) })),
          update:  vi.fn(() => ({ eq: vi.fn(() => ({ eq: mockUpdate })) })),
          delete:  vi.fn(() => ({ eq: mockDelete })),
        }
      }
      if (table === 'contact_segments') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSegmentSingle })) })),
        }
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({
                not: vi.fn(mockContactsQuery),
              })),
            })),
          })),
        }
      }
      return {}
    }),
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockResendSend }
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    rpc: vi.fn(async () => ({ data: 'decrypted_key' })),
  })),
}))

vi.mock('@/lib/get-integration-config', () => ({
  getIntegrationConfig: vi.fn(async () => ({
    id: 'int-1',
    tenant_id: 't1',
    campaign_id: 'c1',
    resend_api_key: 'encrypted_key',
    resend_api_key_hint: 're_1...xy99',
    resend_domain: 'campaign.com',
    twilio_sid: null,
    twilio_token: null,
    twilio_token_hint: null,
    twilio_from: null,
    twilio_whatsapp_from: null,
  })),
}))

// applyFilters used in sendCampaign — return empty to keep tests simple
vi.mock('@/app/dashboard/contacts/segments/actions', () => ({
  applyFilters: vi.fn(async () => ({ data: [] })),
}))

import { createCampaign, sendCampaign, deleteCampaign, sendTestEmail, updateCampaign } from '@/app/dashboard/comunicaciones/actions'

function makeFormData(data: Record<string, string>) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => fd.append(k, v))
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdate.mockResolvedValue({ error: null })
  mockDelete.mockResolvedValue({ error: null })
  mockResendSend.mockResolvedValue({ id: 'email_123' })
  // Default active-tenant context — matches the t1/c1/campaign_manager fixture
  // used in most tests. Override per-test for non-default roles or empty campaigns.
  mockGetActiveCampaignContext.mockResolvedValue({
    activeTenantId:   't1',
    campaignIds:      ['c1'],
    activeCampaignId: 'c1',
    role:             'campaign_manager',
    customRoleId:     null,
  })
})

// ── createCampaign ─────────────────────────────────────────────────────────────

describe('createCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(
      createCampaign(makeFormData({ name: 'Test', subject: 'Hi', body_html: '<p>Hi</p>' }))
    ).rejects.toThrow('REDIRECT:/login')
  })

  it('returns without redirect when user has no permission', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockGetActiveCampaignContext.mockResolvedValueOnce({
      activeTenantId:   't1',
      campaignIds:      ['c1'],
      activeCampaignId: 'c1',
      role:             'volunteer',
      customRoleId:     null,
    })
    const result = await createCampaign(makeFormData({ name: 'Test', subject: 'Hi', body_html: '<p>Hi</p>' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect when name is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    const result = await createCampaign(makeFormData({ name: '', subject: 'Hi', body_html: '<p>Hi</p>' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect when subject is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    const result = await createCampaign(makeFormData({ name: 'Camp', subject: '', body_html: '<p>Hi</p>' }))
    expect(result).toBeUndefined()
  })

  it('creates campaign and redirects', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockInsert.mockResolvedValueOnce({ data: { id: 'ec1' }, error: null })
    await expect(
      createCampaign(makeFormData({ name: 'Agosto', subject: 'Únete', body_html: '<p>Hola</p>' }))
    ).rejects.toThrow('REDIRECT:/dashboard/comunicaciones/ec1')
  })
})

// ── sendCampaign ───────────────────────────────────────────────────────────────

describe('sendCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(sendCampaign('ec1')).rejects.toThrow('REDIRECT:/login')
  })

  it('returns error when campaign not found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockCampaignSingle.mockResolvedValueOnce({ data: null })
    const result = await sendCampaign('ec1')
    expect(result).toEqual({ error: 'Campaña no encontrada' })
  })

  it('returns error when campaign already sent', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockCampaignSingle.mockResolvedValueOnce({
      data: { id: 'ec1', status: 'sent', segment_id: null, subject: 'Hi', body_html: '<p>Hi</p>' },
    })
    const result = await sendCampaign('ec1')
    expect(result).toEqual({ error: 'Esta campaña ya fue enviada' })
  })

  it('returns error when no recipients with email', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockCampaignSingle.mockResolvedValueOnce({
      data: { id: 'ec1', status: 'draft', segment_id: null, subject: 'Hi', body_html: '<p>Hi</p>' },
    })
    mockContactsQuery.mockResolvedValueOnce({ data: [] })
    const result = await sendCampaign('ec1')
    expect(result).toEqual({ error: 'No hay destinatarios con email en este segmento' })
  })

  it('sends emails to contacts without segment', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockCampaignSingle.mockResolvedValueOnce({
      data: { id: 'ec1', status: 'draft', segment_id: null, subject: 'Hola', body_html: '<p>Hi</p>' },
    })
    mockContactsQuery.mockResolvedValueOnce({
      data: [
        { id: 'c1', email: 'ana@test.com',   first_name: 'Ana',   last_name: 'Pérez' },
        { id: 'c2', email: 'juan@test.com',  first_name: 'Juan',  last_name: 'García' },
      ],
    })
    const result = await sendCampaign('ec1')
    expect(result).toEqual({ sent: 2, failed: 0 })
    expect(mockResendSend).toHaveBeenCalledTimes(2)
  })
})

// ── deleteCampaign ─────────────────────────────────────────────────────────────

describe('deleteCampaign', () => {
  it('redirects after delete', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { campaign_ids: ['c1'] } })
    mockCampaignSingle.mockResolvedValueOnce({ data: { campaign_id: 'c1' } })
    await expect(deleteCampaign('ec1')).rejects.toThrow('REDIRECT:/dashboard/comunicaciones')
  })
})

// ── updateCampaign ─────────────────────────────────────────────────────────────

describe('updateCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(
      updateCampaign('ec1', makeFormData({ name: 'Test', subject: 'Hi', body_html: '<p>Hi</p>' }))
    ).rejects.toThrow('REDIRECT:/login')
  })

  it('returns without redirect when user has no permission', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockGetActiveCampaignContext.mockResolvedValueOnce({
      activeTenantId:   't1',
      campaignIds:      ['c1'],
      activeCampaignId: 'c1',
      role:             'volunteer',
      customRoleId:     null,
    })
    const result = await updateCampaign('ec1', makeFormData({ name: 'Test', subject: 'Hi', body_html: '<p>Hi</p>' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect when name is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'campaign_manager' } })
    const result = await updateCampaign('ec1', makeFormData({ name: '', subject: 'Hi', body_html: '<p>Hi</p>' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect when body_html is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'campaign_manager' } })
    const result = await updateCampaign('ec1', makeFormData({ name: 'Camp', subject: 'Hi', body_html: '' }))
    expect(result).toBeUndefined()
  })

  it('updates draft and redirects', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'campaign_manager' } })
    mockUpdate.mockResolvedValueOnce({ error: null })
    await expect(
      updateCampaign('ec1', makeFormData({ name: 'Agosto', subject: 'Únete', body_html: '<p>Hola</p>' }))
    ).rejects.toThrow('REDIRECT:/dashboard/comunicaciones/ec1')
  })
})

// ── sendTestEmail ──────────────────────────────────────────────────────────────

describe('sendTestEmail', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(sendTestEmail('ec1', 'test@example.com')).rejects.toThrow('REDIRECT:/login')
  })

  it('returns error when user has no permission', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockGetActiveCampaignContext.mockResolvedValueOnce({
      activeTenantId:   't1',
      campaignIds:      ['c1'],
      activeCampaignId: 'c1',
      role:             'volunteer',
      customRoleId:     null,
    })
    const result = await sendTestEmail('ec1', 'test@example.com')
    expect(result).toEqual({ error: 'No tienes permiso para enviar emails de prueba' })
  })

  it('returns error when campaign not found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager', full_name: 'Ana Pérez' } })
    mockCampaignSingle.mockResolvedValueOnce({ data: null })
    const result = await sendTestEmail('ec1', 'test@example.com')
    expect(result).toEqual({ error: 'Campaña no encontrada' })
  })

  it('sends test email and returns ok', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager', full_name: 'Ana Pérez' } })
    mockCampaignSingle.mockResolvedValueOnce({
      data: { subject: 'Hola {nombre}', body_html: '<p>Hola {nombre} {apellido}</p>' },
    })
    const result = await sendTestEmail('ec1', 'test@example.com')
    expect(result).toEqual({ ok: true })
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: '[PRUEBA] Hola {nombre}',
      })
    )
  })
})
