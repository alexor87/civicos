import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetUser, mockSignIn, mockUpdateUser } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockSignIn = vi.fn()
  const mockUpdateUser = vi.fn()
  return { mockGetUser, mockSignIn, mockUpdateUser }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignIn,
      updateUser: mockUpdateUser,
    },
  }),
}))

import { POST } from '@/app/api/profile/password/route'

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/profile/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/profile/password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } })
  })

  it('returns 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ currentPassword: 'a', newPassword: 'b', confirmPassword: 'b' }) as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 if fields are missing', async () => {
    const res = await POST(makeRequest({ currentPassword: 'a' }) as any)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('requeridos')
  })

  it('returns 400 if passwords do not match', async () => {
    const res = await POST(makeRequest({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmPassword: 'DiffPass1',
    }) as any)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('no coinciden')
  })

  it('returns 400 if new password is too short', async () => {
    const res = await POST(makeRequest({
      currentPassword: 'OldPass1',
      newPassword: 'Ab1',
      confirmPassword: 'Ab1',
    }) as any)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('8 caracteres')
  })

  it('returns 400 if new password has no uppercase', async () => {
    const res = await POST(makeRequest({
      currentPassword: 'OldPass1',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword1',
    }) as any)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('mayúscula')
  })

  it('returns 400 if new password has no number', async () => {
    const res = await POST(makeRequest({
      currentPassword: 'OldPass1',
      newPassword: 'NewPassword',
      confirmPassword: 'NewPassword',
    }) as any)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('número')
  })

  it('returns 400 if current password is wrong', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('Invalid credentials') })
    const res = await POST(makeRequest({
      currentPassword: 'WrongPass1',
      newPassword: 'NewPass123',
      confirmPassword: 'NewPass123',
    }) as any)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('incorrecta')
  })

  it('changes password successfully', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({ error: null })
    const res = await POST(makeRequest({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass123',
      confirmPassword: 'NewPass123',
    }) as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })
})
