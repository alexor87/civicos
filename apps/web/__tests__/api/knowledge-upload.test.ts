import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockMetaInsert,
  mockDocInsert,
  mockMetaUpdate,
  mockOpenAIEmbeddings,
  mockStorageUpload,
  mockStorageCreateBucket,
} = vi.hoisted(() => ({
  mockGetUser:             vi.fn(),
  mockProfileSingle:       vi.fn(),
  mockMetaInsert:          vi.fn(),
  mockDocInsert:           vi.fn().mockResolvedValue({ error: null }),
  mockMetaUpdate:          vi.fn().mockResolvedValue({ error: null }),
  mockOpenAIEmbeddings:    vi.fn().mockResolvedValue({
    data: [{ embedding: new Array(1536).fill(0.1) }],
  }),
  mockStorageUpload:       vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
  mockStorageCreateBucket: vi.fn().mockResolvedValue({ data: null, error: null }),
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
      if (table === 'knowledge_document_meta') {
        return {
          insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockMetaInsert })) })),
          update: vi.fn(() => ({ eq: vi.fn(() => mockMetaUpdate) })),
        }
      }
      if (table === 'knowledge_documents') {
        return { insert: vi.fn(mockDocInsert) }
      }
      return {}
    }),
  })),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      createBucket: mockStorageCreateBucket,
      from: vi.fn(() => ({
        upload: mockStorageUpload,
      })),
    },
  })),
}))

vi.mock('openai', () => ({
  default: class MockOpenAI {
    embeddings = { create: mockOpenAIEmbeddings }
  },
}))

vi.mock('pdf-parse', () => ({
  default: vi.fn().mockResolvedValue({ text: 'Contenido del PDF extraído' }),
}))

vi.mock('mammoth', () => ({
  extractRawText: vi.fn().mockResolvedValue({ value: 'Contenido del docx extraído' }),
}))

import { POST } from '@/app/api/knowledge/upload/route'

function makeRequest(formData: FormData) {
  return new NextRequest('http://localhost/api/knowledge/upload', {
    method: 'POST',
    body:   formData,
  })
}

function makeTextFile(name = 'documento.txt', content = 'Hola mundo\n\nEsto es un documento de prueba.') {
  return new File([content], name, { type: 'text/plain' })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockOpenAIEmbeddings.mockResolvedValue({
    data: [{ embedding: new Array(1536).fill(0.1) }],
  })
  mockDocInsert.mockResolvedValue({ error: null })
  mockMetaUpdate.mockResolvedValue({ error: null })
})

describe('POST /api/knowledge/upload', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const fd = new FormData()
    fd.append('file', makeTextFile())
    fd.append('campaign_id', 'c1')
    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is a volunteer', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'volunteer' },
    })
    const fd = new FormData()
    fd.append('file', makeTextFile())
    fd.append('campaign_id', 'c1')
    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(403)
  })

  it('returns 400 when no file is provided', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    const fd = new FormData()
    fd.append('campaign_id', 'c1')
    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
  })

  it('returns 400 when campaign_id is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    const fd = new FormData()
    fd.append('file', makeTextFile())
    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
  })

  it('uploads text file and returns { id, title, chunks }', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' },
    })
    mockMetaInsert.mockResolvedValueOnce({ data: { id: 'meta1' }, error: null })

    const fd = new FormData()
    fd.append('file', makeTextFile('propuestas.txt', 'Propuesta 1\n\nPropuesta 2'))
    fd.append('campaign_id', 'c1')
    fd.append('title', 'Propuestas del candidato')

    const res  = await POST(makeRequest(fd))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toMatchObject({ id: 'meta1', title: 'Propuestas del candidato' })
    expect(typeof data.chunks).toBe('number')
  })
})
