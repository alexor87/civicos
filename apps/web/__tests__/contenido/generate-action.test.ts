import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockCampaignSingle,
  mockClaudeCreate,
} = vi.hoisted(() => ({
  mockGetUser:        vi.fn(),
  mockProfileSingle:  vi.fn(),
  mockCampaignSingle: vi.fn(),
  mockClaudeCreate:   vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSingle })) })) }
      }
      if (table === 'campaigns') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockCampaignSingle })) })) }
      }
      return {}
    }),
  })),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () {
    return { messages: { create: mockClaudeCreate } }
  }),
}))

import { generateContent } from '@/app/dashboard/contenido/generate-action'

const MOCK_EMAIL_RESPONSE = {
  subject: 'Únete al mitin del 20 de marzo',
  blocks: [
    { type: 'header', content: 'Gran mitin de campaña', subtext: 'Sábado 20 de marzo · Plaza Mayor' },
    { type: 'text',   content: 'Te esperamos este sábado para celebrar juntos los logros de nuestra campaña.' },
    { type: 'button', text: 'Confirmar asistencia', url: 'https://civicos.app/rsvp' },
  ],
}

const MOCK_EMAIL_BLOCKS = [
  { id: 'ai-block-0', type: 'header', props: { text: 'Gran mitin de campaña', subtext: 'Sábado 20 de marzo · Plaza Mayor', bgColor: '#2960ec', textColor: '#ffffff', padding: 'md' } },
  { id: 'ai-block-1', type: 'text',   props: { content: 'Te esperamos este sábado.', fontSize: 'md', align: 'left', color: '#586069' } },
  { id: 'ai-block-2', type: 'button', props: { text: 'Confirmar asistencia', url: 'https://civicos.app/rsvp', bgColor: '#2960ec', textColor: '#ffffff', size: 'md', align: 'center', borderRadius: 'sm' } },
]

const MOCK_SCRIPT_RESPONSE = {
  intro: 'Buenos días, soy voluntario de la campaña de María González.',
  questions: ['¿Cuál es su principal preocupación en el barrio?', '¿Ha tenido oportunidad de conocer a nuestra candidata?'],
  closing: 'Muchas gracias por su tiempo. Recuerde que el día de elecciones es el 15 de junio.',
}

const MOCK_SMS_RESPONSE = {
  sms_text: 'Hola {nombre}, únete al mitin del 20 de marzo en Plaza Mayor. Más info: civicos.app/evento',
}

const MOCK_TALKING_POINTS_RESPONSE = {
  points: [
    'Reducir el desempleo juvenil en un 30% con nuevas zonas francas',
    'Mejorar el transporte público con 50 buses nuevos',
    'Construir 3 nuevos centros de salud en zonas vulnerables',
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  mockProfileSingle.mockResolvedValue({
    data: { tenant_id: 'tenant1', campaign_ids: ['camp1'], role: 'campaign_manager' },
  })
  mockCampaignSingle.mockResolvedValue({
    data: { id: 'camp1', name: 'Campaña María González', candidate_name: 'María González', key_topics: ['empleo', 'salud'], description: 'Campaña presidencial 2026' },
  })
  mockClaudeCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(MOCK_EMAIL_RESPONSE) }],
  })
})

describe('generateContent', () => {
  it('returns error when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const result = await generateContent('email', 'Mitin del 20 de marzo', 'formal')
    expect(result.error).toBe('No autorizado')
  })

  it('returns error when user has no campaign', async () => {
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 'tenant1', campaign_ids: [], role: 'campaign_manager' },
    })
    const result = await generateContent('email', 'Mitin', 'formal')
    expect(result.error).toBe('No hay campaña activa')
  })

  it('generates email with subject and blocks', async () => {
    const result = await generateContent('email', 'Invitación al mitin del 20 de marzo', 'cercano')
    expect(result.error).toBeUndefined()
    expect(result.subject).toBe(MOCK_EMAIL_RESPONSE.subject)
    expect(Array.isArray(result.blocks)).toBe(true)
    expect(result.blocks!.length).toBeGreaterThan(0)
  })

  it('generates canvassing script with intro, questions and closing', async () => {
    mockClaudeCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(MOCK_SCRIPT_RESPONSE) }],
    })
    const result = await generateContent('script', 'Script para zona norte', 'cercano')
    expect(result.error).toBeUndefined()
    expect(result.script?.intro).toBeDefined()
    expect(Array.isArray(result.script?.questions)).toBe(true)
    expect(result.script?.closing).toBeDefined()
  })

  it('generates SMS text for tipo sms', async () => {
    mockClaudeCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(MOCK_SMS_RESPONSE) }],
    })
    const result = await generateContent('sms', 'Recordatorio del mitin', 'urgente')
    expect(result.error).toBeUndefined()
    expect(typeof result.sms_text).toBe('string')
    expect(result.sms_text!.length).toBeGreaterThan(0)
  })

  it('generates talking points as array', async () => {
    mockClaudeCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(MOCK_TALKING_POINTS_RESPONSE) }],
    })
    const result = await generateContent('talking_points', 'Propuestas de empleo y salud', 'formal')
    expect(result.error).toBeUndefined()
    expect(Array.isArray(result.points)).toBe(true)
    expect(result.points!.length).toBeGreaterThan(0)
  })

  it('includes campaign context (candidate_name, key_topics) in the Claude call', async () => {
    await generateContent('email', 'Mitin electoral', 'formal')
    const callArgs = mockClaudeCreate.mock.calls[0][0]
    const prompt = callArgs.messages[0].content as string
    expect(prompt).toContain('María González')
    expect(prompt).toContain('empleo')
  })

  it('handles Claude API error gracefully', async () => {
    mockClaudeCreate.mockRejectedValueOnce(new Error('API timeout'))
    const result = await generateContent('email', 'Mitin', 'formal')
    expect(result.error).toContain('generar')
  })

  it('handles malformed Claude JSON response gracefully', async () => {
    mockClaudeCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not json {{{{' }],
    })
    const result = await generateContent('email', 'Mitin', 'formal')
    expect(result.error).toBeDefined()
  })
})
