import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockStorageUpload,
  mockGetPublicUrl,
  mockCreateBucket,
} = vi.hoisted(() => ({
  mockGetUser:       vi.fn(),
  mockStorageUpload: vi.fn(),
  mockGetPublicUrl:  vi.fn(),
  mockCreateBucket:  vi.fn(),
}))

const mockStorageObj = () => ({
  createBucket: mockCreateBucket,
  from: vi.fn(() => ({
    upload:       mockStorageUpload,
    getPublicUrl: mockGetPublicUrl,
  })),
})

// Mock SSR client (used for auth)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

// Mock direct supabase-js client (used for storage operations)
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: mockStorageObj(),
  })),
}))

import { POST } from '@/app/api/upload/image/route'
import { NextRequest } from 'next/server'

function makeRequest(file?: File): NextRequest {
  const req = new NextRequest('http://localhost/api/upload/image', {
    method: 'POST',
    body: '{}', // placeholder — formData() is mocked below
  })
  // jsdom's FormData doesn't serialize binary files correctly through
  // the NextRequest multipart pipeline. Mock formData() to return the
  // file directly so arrayBuffer() works on the original File instance.
  Object.defineProperty(req, 'formData', {
    value: async () => {
      const fd = new FormData()
      if (file) fd.append('file', file)
      return fd
    },
  })
  return req
}

function makeFile(name = 'photo.jpg', type = 'image/jpeg'): File {
  // JPEG magic bytes: FF D8 FF E0
  const bytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10])
  return new File([bytes], name, { type })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/campaign-images/u1/123.jpg' } })
  mockStorageUpload.mockResolvedValue({ error: null })
  mockCreateBucket.mockResolvedValue({ error: null })
})

describe('POST /api/upload/image', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await POST(makeRequest(makeFile()))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 when no file is provided', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const res = await POST(makeRequest()) // no file
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('No file provided')
  })

  it('returns public URL on successful upload', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const res = await POST(makeRequest(makeFile()))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://cdn.example.com/campaign-images/u1/123.jpg')
    expect(mockStorageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^u1\/.+/),
      expect.anything(),
      expect.objectContaining({ contentType: 'image/jpeg' })
    )
  })

  it('returns 500 when storage upload fails', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockStorageUpload.mockResolvedValueOnce({ error: { message: 'Bucket not found' } })
    const res = await POST(makeRequest(makeFile()))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Bucket not found')
  })
})
