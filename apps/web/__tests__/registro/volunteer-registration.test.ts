import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockCampaignSingle,
  mockContactMaybeSingle,
  mockContactInsert,
} = vi.hoisted(() => ({
  mockCampaignSingle:     vi.fn(),
  mockContactMaybeSingle: vi.fn(),
  mockContactInsert:      vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
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
              eq: vi.fn(() => ({
                is: vi.fn(() => ({ maybeSingle: mockContactMaybeSingle })),
              })),
            })),
          })),
          insert: vi.fn(() => mockContactInsert()),
        }
      }
      return {}
    }),
  })),
}))

import { registerVolunteer, getCampaignPublicData } from '@/app/registro/[id]/actions'

const BASE_INPUT = {
  campaignId:    'camp-123',
  firstName:     'María',
  lastName:      'García',
  email:         'maria@test.com',
  phone:         '+57300000000',
  city:          'Bogotá',
  availability:  ['mañanas', 'tardes'],
  howDidYouHear: 'Redes sociales',
}

const ACTIVE_CAMPAIGN = {
  id:                             'camp-123',
  tenant_id:                      'tenant-1',
  volunteer_registration_enabled: true,
}

describe('registerVolunteer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCampaignSingle.mockResolvedValue({ data: ACTIVE_CAMPAIGN })
    mockContactMaybeSingle.mockResolvedValue({ data: null })
    mockContactInsert.mockResolvedValue({ error: null })
  })

  it('returns success when all required fields provided and no duplicate', async () => {
    const result = await registerVolunteer(BASE_INPUT)
    expect(result.success).toBe(true)
  })

  it('returns error when required fields are missing', async () => {
    const result = await registerVolunteer({ ...BASE_INPUT, firstName: '' })
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toMatch(/obligatorios/)
  })

  it('returns error when campaign not found', async () => {
    mockCampaignSingle.mockResolvedValue({ data: null })
    const result = await registerVolunteer(BASE_INPUT)
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toMatch(/no encontrada/)
  })

  it('returns error when registration is disabled', async () => {
    mockCampaignSingle.mockResolvedValue({
      data: { ...ACTIVE_CAMPAIGN, volunteer_registration_enabled: false },
    })
    const result = await registerVolunteer(BASE_INPUT)
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toMatch(/no está habilitado/)
  })

  it('returns duplicate error when email already exists', async () => {
    mockContactMaybeSingle.mockResolvedValue({ data: { id: 'existing-contact' } })
    const result = await registerVolunteer(BASE_INPUT)
    expect(result.success).toBe(false)
    expect((result as { duplicate: boolean }).duplicate).toBe(true)
  })

  it('returns error when DB insert fails', async () => {
    mockContactInsert.mockResolvedValue({ error: { message: 'DB error' } })
    const result = await registerVolunteer(BASE_INPUT)
    expect(result.success).toBe(false)
  })

  it('normalizes email to lowercase', async () => {
    let insertedEmail: string | undefined
    vi.mocked(
      (await import('@supabase/supabase-js')).createClient
    ).mockImplementationOnce(() => ({
      from: vi.fn((table: string) => {
        if (table === 'campaigns') {
          return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockCampaignSingle })) })) }
        }
        if (table === 'contacts') {
          return {
            select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ is: vi.fn(() => ({ maybeSingle: mockContactMaybeSingle })) })) })) })),
            insert: vi.fn((row: Record<string, unknown>) => {
              insertedEmail = row.email as string
              return mockContactInsert()
            }),
          }
        }
        return {}
      }),
    }) as ReturnType<typeof import('@supabase/supabase-js').createClient>)

    await registerVolunteer({ ...BASE_INPUT, email: 'MARIA@TEST.COM' })
    expect(insertedEmail).toBe('maria@test.com')
  })
})

describe('getCampaignPublicData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when campaign does not exist', async () => {
    mockCampaignSingle.mockResolvedValue({ data: null })
    // Adjust mock for different select shape
    vi.mocked(
      (await import('@supabase/supabase-js')).createClient
    ).mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null }) })),
        })),
      })),
    }) as ReturnType<typeof import('@supabase/supabase-js').createClient>)

    const result = await getCampaignPublicData('nonexistent')
    expect(result).toBeNull()
  })

  it('returns campaign data when found', async () => {
    const mockData = {
      id: 'camp-1', name: 'Test Campaign', candidate_name: 'Juan',
      brand_color: '#ff0000', logo_url: null, election_type: 'municipal',
      volunteer_registration_enabled: true,
    }
    vi.mocked(
      (await import('@supabase/supabase-js')).createClient
    ).mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: mockData }) })),
        })),
      })),
    }) as ReturnType<typeof import('@supabase/supabase-js').createClient>)

    const result = await getCampaignPublicData('camp-1')
    expect(result?.name).toBe('Test Campaign')
    expect(result?.brand_color).toBe('#ff0000')
  })
})
