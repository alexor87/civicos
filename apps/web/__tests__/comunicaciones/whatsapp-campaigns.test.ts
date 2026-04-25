import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockInsert,
  mockWaInsert,
  mockWaCampaignSingle,
  mockCampaignSingle,
  mockUpdate,
  mockDelete,
  mockContactsQuery,
  mockContactsByIds,
  mockTwilioCreate,
  mockConversationsInsert,
} = vi.hoisted(() => ({
  mockGetUser:             vi.fn(),
  mockProfileSingle:       vi.fn(),
  mockInsert:              vi.fn(),
  mockWaInsert:            vi.fn(),
  mockWaCampaignSingle:    vi.fn(),
  mockCampaignSingle:      vi.fn().mockResolvedValue({
    data: {
      twilio_sid:            'ACtest',
      twilio_token:          'token123',
      twilio_whatsapp_from:  '+14155238886',
    },
  }),
  mockUpdate:              vi.fn(),
  mockDelete:              vi.fn(),
  mockContactsQuery:       vi.fn(),
  mockContactsByIds:       vi.fn(),
  mockTwilioCreate:        vi.fn().mockResolvedValue({ sid: 'SM123' }),
  mockConversationsInsert: vi.fn().mockResolvedValue({ error: null }),
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
      if (table === 'whatsapp_campaigns') {
        return {
          insert:  vi.fn((payload: unknown) => {
            mockWaInsert(payload)
            return { select: vi.fn(() => ({ single: mockInsert })) }
          }),
          select:  vi.fn(() => ({ eq: vi.fn(() => ({ single: mockWaCampaignSingle })) })),
          update:  vi.fn(() => ({ eq: vi.fn(() => ({ eq: mockUpdate })) })),
          delete:  vi.fn(() => ({ eq: mockDelete })),
        }
      }
      if (table === 'campaigns') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockCampaignSingle })) })),
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
            in: vi.fn(() => ({
              is: vi.fn(() => ({
                not: vi.fn(mockContactsByIds),
              })),
            })),
          })),
        }
      }
      if (table === 'whatsapp_conversations') {
        return {
          insert: vi.fn(mockConversationsInsert),
        }
      }
      return {}
    }),
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    rpc: vi.fn(async () => ({ data: 'decrypted_token' })),
  })),
}))

vi.mock('@/lib/get-integration-config', () => ({
  getIntegrationConfig: vi.fn(async () => ({
    id: 'int-1',
    tenant_id: 't1',
    campaign_id: 'c1',
    twilio_sid: 'ACtest',
    twilio_token: 'encrypted_token',
    twilio_token_hint: 'tok1...n123',
    twilio_from: '+15550000000',
    twilio_whatsapp_from: '+14155238886',
    resend_api_key: null,
    resend_api_key_hint: null,
    resend_domain: null,
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: { create: mockTwilioCreate },
  })),
}))

vi.mock('@/app/dashboard/contacts/segments/actions', () => ({
  applyFilters: vi.fn(async () => ({ data: [] })),
}))

import {
  createWhatsAppCampaign,
  sendWhatsAppCampaign,
  deleteWhatsAppCampaign,
  updateWhatsAppCampaign,
} from '@/app/dashboard/comunicaciones/whatsapp-actions'

function makeFormData(data: Record<string, string>) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => fd.append(k, v))
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdate.mockResolvedValue({ error: null })
  mockDelete.mockResolvedValue({ error: null })
  mockTwilioCreate.mockResolvedValue({ sid: 'SM_WA123' })
  mockConversationsInsert.mockResolvedValue({ error: null })
})

// ── createWhatsAppCampaign ────────────────────────────────────────────────────

describe('createWhatsAppCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(
      createWhatsAppCampaign(makeFormData({ name: 'Test', template_name: 'hello_world' }))
    ).rejects.toThrow('REDIRECT:/login')
  })

  it('returns undefined when user has no permission (volunteer)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'volunteer' },
    })
    const result = await createWhatsAppCampaign(
      makeFormData({ name: 'Test', template_name: 'hello_world' })
    )
    expect(result).toBeUndefined()
  })

  it('returns undefined when name is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    const result = await createWhatsAppCampaign(
      makeFormData({ name: '', template_name: 'hello_world' })
    )
    expect(result).toBeUndefined()
  })

  it('returns undefined when template_name is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    const result = await createWhatsAppCampaign(
      makeFormData({ name: 'Test', template_name: '' })
    )
    expect(result).toBeUndefined()
  })

  it('creates campaign and redirects', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockInsert.mockResolvedValueOnce({ data: { id: 'wa1' }, error: null })
    await expect(
      createWhatsAppCampaign(makeFormData({ name: 'WA Agosto', template_name: 'promo_votacion' }))
    ).rejects.toThrow('REDIRECT:/dashboard/comunicaciones/whatsapp/wa1')
  })

  it('persists recipient_ids when manual selection is provided', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockInsert.mockResolvedValueOnce({ data: { id: 'wa2' }, error: null })
    await expect(
      createWhatsAppCampaign(makeFormData({
        name:           'Manual WA',
        template_name:  'hello_world',
        segment_id:     'seg-ignored',
        recipient_ids:  JSON.stringify(['x', 'y']),
      }))
    ).rejects.toThrow('REDIRECT:/dashboard/comunicaciones/whatsapp/wa2')
    expect(mockWaInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_ids: ['x', 'y'],
        segment_id:    null,
      })
    )
  })
})

// ── sendWhatsAppCampaign ──────────────────────────────────────────────────────

describe('sendWhatsAppCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(sendWhatsAppCampaign('wa1')).rejects.toThrow('REDIRECT:/login')
  })

  it('returns error when campaign not found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockWaCampaignSingle.mockResolvedValueOnce({ data: null })
    const result = await sendWhatsAppCampaign('wa1')
    expect(result).toEqual({ error: 'Campaña de WhatsApp no encontrada' })
  })

  it('returns error when campaign already sent', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockWaCampaignSingle.mockResolvedValueOnce({
      data: { id: 'wa1', status: 'sent', segment_id: null, template_name: 'hello' },
    })
    const result = await sendWhatsAppCampaign('wa1')
    expect(result).toEqual({ error: 'Esta campaña ya fue enviada' })
  })

  it('returns error when analyst role tries to send', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'analyst' },
    })
    const result = await sendWhatsAppCampaign('wa1')
    expect(result).toEqual({ error: 'No tienes permiso para enviar campañas de WhatsApp' })
  })

  it('returns error when no recipients with phone', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockWaCampaignSingle.mockResolvedValueOnce({
      data: { id: 'wa1', status: 'draft', segment_id: null, template_name: 'hello', template_variables: {} },
    })
    mockContactsQuery.mockResolvedValueOnce({ data: [] })
    const result = await sendWhatsAppCampaign('wa1')
    expect(result).toEqual({ error: 'No hay destinatarios con teléfono para esta campaña' })
  })

  it('sends WhatsApp to manually selected recipients (overrides segment)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockWaCampaignSingle.mockResolvedValueOnce({
      data: {
        id: 'wa1', status: 'draft', segment_id: 'seg1',
        recipient_ids: ['ct-a', 'ct-b'],
        template_name: 'hello_world', template_variables: {},
      },
    })
    mockContactsByIds.mockResolvedValueOnce({
      data: [
        { id: 'ct-a', phone: '+573001111111', first_name: 'Ana',  last_name: 'A.' },
        { id: 'ct-b', phone: '+573002222222', first_name: 'Beto', last_name: 'B.' },
      ],
    })
    const result = await sendWhatsAppCampaign('wa1')
    expect(result).toEqual({ sent: 2, failed: 0 })
    expect(mockTwilioCreate).toHaveBeenCalledTimes(2)
    expect(mockContactsQuery).not.toHaveBeenCalled()
  })

  it('sends WhatsApp to contacts and logs conversations', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockWaCampaignSingle.mockResolvedValueOnce({
      data: {
        id: 'wa1', status: 'draft', segment_id: null,
        template_name: 'hello_world', template_variables: {},
      },
    })
    mockContactsQuery.mockResolvedValueOnce({
      data: [
        { id: 'ct1', phone: '+573001234567', first_name: 'Ana',  last_name: 'Pérez' },
        { id: 'ct2', phone: '+573009876543', first_name: 'Juan', last_name: 'García' },
      ],
    })
    const result = await sendWhatsAppCampaign('wa1')
    expect(result).toEqual({ sent: 2, failed: 0 })
    expect(mockTwilioCreate).toHaveBeenCalledTimes(2)
  })

  it('marks campaign as failed when all Twilio calls fail', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockWaCampaignSingle.mockResolvedValueOnce({
      data: {
        id: 'wa1', status: 'draft', segment_id: null,
        template_name: 'hello_world', template_variables: {},
      },
    })
    mockContactsQuery.mockResolvedValueOnce({
      data: [{ id: 'ct1', phone: '+573001234567', first_name: 'Ana', last_name: 'Pérez' }],
    })
    mockTwilioCreate.mockRejectedValueOnce(new Error('Twilio error'))
    const result = await sendWhatsAppCampaign('wa1')
    expect(result).toEqual({ sent: 0, failed: 1 })
  })
})

// ── deleteWhatsAppCampaign ────────────────────────────────────────────────────

describe('deleteWhatsAppCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(deleteWhatsAppCampaign('wa1')).rejects.toThrow('REDIRECT:/login')
  })

  it('redirects after delete', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { campaign_ids: ['c1'] } })
    mockWaCampaignSingle.mockResolvedValueOnce({ data: { campaign_id: 'c1' } })
    await expect(deleteWhatsAppCampaign('wa1')).rejects.toThrow(
      'REDIRECT:/dashboard/comunicaciones?tab=whatsapp'
    )
  })
})

// ── updateWhatsAppCampaign ────────────────────────────────────────────────────

describe('updateWhatsAppCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(
      updateWhatsAppCampaign('wa1', makeFormData({ name: 'Test', template_name: 'hello' }))
    ).rejects.toThrow('REDIRECT:/login')
  })

  it('returns undefined when user has no permission', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'volunteer' } })
    const result = await updateWhatsAppCampaign(
      'wa1', makeFormData({ name: 'Test', template_name: 'hello' })
    )
    expect(result).toBeUndefined()
  })

  it('updates draft and redirects', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'campaign_manager' } })
    mockUpdate.mockResolvedValueOnce({ error: null })
    await expect(
      updateWhatsAppCampaign('wa1', makeFormData({ name: 'WA Agosto', template_name: 'promo' }))
    ).rejects.toThrow('REDIRECT:/dashboard/comunicaciones/whatsapp/wa1')
  })
})
