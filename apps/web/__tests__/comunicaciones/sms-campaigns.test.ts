import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockInsert,
  mockSmsInsert,
  mockSmsSingle,
  mockCampaignSingle,
  mockUpdate,
  mockDelete,
  mockSegmentSingle,
  mockContactsQuery,
  mockContactsByIds,
  mockTwilioCreate,
} = vi.hoisted(() => ({
  mockGetUser:        vi.fn(),
  mockProfileSingle:  vi.fn(),
  mockInsert:         vi.fn(),
  mockSmsInsert:      vi.fn(),
  mockSmsSingle:      vi.fn(),
  mockCampaignSingle: vi.fn().mockResolvedValue({ data: {
    twilio_sid:   'ACtest',
    twilio_token: 'token123',
    twilio_from:  '+15550000000',
  }}),
  mockUpdate:         vi.fn(),
  mockDelete:         vi.fn(),
  mockSegmentSingle:  vi.fn(),
  mockContactsQuery:  vi.fn(),
  mockContactsByIds:  vi.fn(),
  mockTwilioCreate:   vi.fn().mockResolvedValue({ sid: 'SM123' }),
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
      if (table === 'sms_campaigns') {
        return {
          insert:  vi.fn((payload: unknown) => {
            mockSmsInsert(payload)
            return { select: vi.fn(() => ({ single: mockInsert })) }
          }),
          select:  vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSmsSingle })) })),
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
            in: vi.fn(() => ({
              is: vi.fn(() => ({
                not: vi.fn(mockContactsByIds),
              })),
            })),
          })),
        }
      }
      if (table === 'campaigns') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockCampaignSingle })) })),
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
    twilio_whatsapp_from: null,
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
  createSmsCampaign,
  sendSmsCampaign,
  deleteSmsCampaign,
  sendTestSms,
  updateSmsCampaign,
} from '@/app/dashboard/comunicaciones/sms-actions'

function makeFormData(data: Record<string, string>) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => fd.append(k, v))
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdate.mockResolvedValue({ error: null })
  mockDelete.mockResolvedValue({ error: null })
  mockTwilioCreate.mockResolvedValue({ sid: 'SM_123' })
})

// ── createSmsCampaign ─────────────────────────────────────────────────────────

describe('createSmsCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(
      createSmsCampaign(makeFormData({ name: 'Test', body_text: 'Hola {nombre}' }))
    ).rejects.toThrow('REDIRECT:/login')
  })

  it('returns without redirect when user has no permission', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'volunteer' },
    })
    const result = await createSmsCampaign(makeFormData({ name: 'Test', body_text: 'Hola' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect when name is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    const result = await createSmsCampaign(makeFormData({ name: '', body_text: 'Hola' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect when body_text is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    const result = await createSmsCampaign(makeFormData({ name: 'Test', body_text: '' }))
    expect(result).toBeUndefined()
  })

  it('creates campaign and redirects', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockInsert.mockResolvedValueOnce({ data: { id: 'sms1' }, error: null })
    await expect(
      createSmsCampaign(makeFormData({ name: 'SMS Agosto', body_text: 'Únete {nombre}' }))
    ).rejects.toThrow('REDIRECT:/dashboard/comunicaciones/sms/sms1')
  })

  it('persists recipient_ids when manual selection is provided', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockInsert.mockResolvedValueOnce({ data: { id: 'sms2' }, error: null })
    await expect(
      createSmsCampaign(makeFormData({
        name: 'Manual SMS',
        body_text: 'Hola',
        segment_id: 'seg-should-be-ignored',
        recipient_ids: JSON.stringify(['a', 'b', 'c']),
      }))
    ).rejects.toThrow('REDIRECT:/dashboard/comunicaciones/sms/sms2')
    expect(mockSmsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_ids: ['a', 'b', 'c'],
        segment_id:    null, // overridden because recipient_ids is set
      })
    )
  })

  it('ignores invalid recipient_ids payload', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockInsert.mockResolvedValueOnce({ data: { id: 'sms3' }, error: null })
    await expect(
      createSmsCampaign(makeFormData({
        name: 'Bad IDs',
        body_text: 'Hola',
        recipient_ids: 'not-json',
      }))
    ).rejects.toThrow('REDIRECT:/dashboard/comunicaciones/sms/sms3')
    expect(mockSmsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ recipient_ids: null })
    )
  })
})

// ── sendSmsCampaign ───────────────────────────────────────────────────────────

describe('sendSmsCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(sendSmsCampaign('sms1')).rejects.toThrow('REDIRECT:/login')
  })

  it('returns error when campaign not found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockSmsSingle.mockResolvedValueOnce({ data: null })
    const result = await sendSmsCampaign('sms1')
    expect(result).toEqual({ error: 'Campaña SMS no encontrada' })
  })

  it('returns error when campaign already sent', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockSmsSingle.mockResolvedValueOnce({
      data: { id: 'sms1', status: 'sent', segment_id: null, body_text: 'Hola' },
    })
    const result = await sendSmsCampaign('sms1')
    expect(result).toEqual({ error: 'Esta campaña SMS ya fue enviada' })
  })

  it('returns error when no recipients with phone', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockSmsSingle.mockResolvedValueOnce({
      data: { id: 'sms1', status: 'draft', segment_id: null, body_text: 'Hola' },
    })
    mockContactsQuery.mockResolvedValueOnce({ data: [] })
    const result = await sendSmsCampaign('sms1')
    expect(result).toEqual({ error: 'No hay destinatarios con teléfono para esta campaña' })
  })

  it('returns error when analyst role tries to send', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'analyst' },
    })
    const result = await sendSmsCampaign('sms1')
    expect(result).toEqual({ error: 'No tienes permiso para enviar campañas SMS' })
  })

  it('sends SMS to manually selected recipients (overrides segment)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockSmsSingle.mockResolvedValueOnce({
      data: {
        id: 'sms1',
        status: 'draft',
        segment_id: 'seg1',
        recipient_ids: ['contact-a', 'contact-b'],
        body_text: 'Hola {nombre}',
      },
    })
    mockContactsByIds.mockResolvedValueOnce({
      data: [
        { id: 'contact-a', phone: '+573001111111', first_name: 'Ana',  last_name: 'A.' },
        { id: 'contact-b', phone: '+573002222222', first_name: 'Beto', last_name: 'B.' },
      ],
    })
    const result = await sendSmsCampaign('sms1')
    expect(result).toEqual({ sent: 2, failed: 0 })
    expect(mockTwilioCreate).toHaveBeenCalledTimes(2)
    // Segment branch must not execute
    expect(mockSegmentSingle).not.toHaveBeenCalled()
    expect(mockContactsQuery).not.toHaveBeenCalled()
  })

  it('sends SMS to contacts without segment', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockSmsSingle.mockResolvedValueOnce({
      data: { id: 'sms1', status: 'draft', segment_id: null, body_text: 'Hola {nombre}' },
    })
    mockContactsQuery.mockResolvedValueOnce({
      data: [
        { id: 'c1', phone: '+573001234567', first_name: 'Ana',  last_name: 'Pérez' },
        { id: 'c2', phone: '+573009876543', first_name: 'Juan', last_name: 'García' },
      ],
    })
    const result = await sendSmsCampaign('sms1')
    expect(result).toEqual({ sent: 2, failed: 0 })
    expect(mockTwilioCreate).toHaveBeenCalledTimes(2)
  })
})

// ── deleteSmsCampaign ─────────────────────────────────────────────────────────

describe('deleteSmsCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(deleteSmsCampaign('sms1')).rejects.toThrow('REDIRECT:/login')
  })

  it('redirects after delete', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { campaign_ids: ['c1'] } })
    mockSmsSingle.mockResolvedValueOnce({ data: { campaign_id: 'c1' } })
    await expect(deleteSmsCampaign('sms1')).rejects.toThrow('REDIRECT:/dashboard/comunicaciones?tab=sms')
  })
})

// ── updateSmsCampaign ─────────────────────────────────────────────────────────

describe('updateSmsCampaign', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(
      updateSmsCampaign('sms1', makeFormData({ name: 'Test', body_text: 'Hola' }))
    ).rejects.toThrow('REDIRECT:/login')
  })

  it('returns without redirect when user has no permission', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'volunteer' } })
    const result = await updateSmsCampaign('sms1', makeFormData({ name: 'Test', body_text: 'Hola' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect when name is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'campaign_manager' } })
    const result = await updateSmsCampaign('sms1', makeFormData({ name: '', body_text: 'Hola' }))
    expect(result).toBeUndefined()
  })

  it('returns without redirect when body_text is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'campaign_manager' } })
    const result = await updateSmsCampaign('sms1', makeFormData({ name: 'Test', body_text: '' }))
    expect(result).toBeUndefined()
  })

  it('updates draft and redirects', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'campaign_manager' } })
    mockUpdate.mockResolvedValueOnce({ error: null })
    await expect(
      updateSmsCampaign('sms1', makeFormData({ name: 'SMS Agosto', body_text: 'Únete {nombre}' }))
    ).rejects.toThrow('REDIRECT:/dashboard/comunicaciones/sms/sms1')
  })
})

// ── sendTestSms ───────────────────────────────────────────────────────────────

describe('sendTestSms', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(sendTestSms('sms1', '+573001234567')).rejects.toThrow('REDIRECT:/login')
  })

  it('returns error when user has no permission', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', role: 'volunteer', full_name: 'Ana Pérez', campaign_ids: ['c1'] } })
    const result = await sendTestSms('sms1', '+573001234567')
    expect(result).toEqual({ error: 'No tienes permiso para enviar SMS de prueba' })
  })

  it('returns error when campaign not found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', role: 'campaign_manager', full_name: 'Ana Pérez', campaign_ids: ['c1'] } })
    mockSmsSingle.mockResolvedValueOnce({ data: null })
    const result = await sendTestSms('sms1', '+573001234567')
    expect(result).toEqual({ error: 'Campaña SMS no encontrada' })
  })

  it('sends test SMS and returns ok', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', role: 'campaign_manager', full_name: 'Ana Pérez', campaign_ids: ['c1'] } })
    mockSmsSingle.mockResolvedValueOnce({
      data: { body_text: 'Hola {nombre} {apellido}, únete hoy.' },
    })
    const result = await sendTestSms('sms1', '+573001234567')
    expect(result).toEqual({ ok: true })
    expect(mockTwilioCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        to:   '+573001234567',
        body: expect.stringContaining('[PRUEBA]'),
      })
    )
  })
})
