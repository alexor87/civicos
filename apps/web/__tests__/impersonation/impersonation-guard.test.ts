import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import {
  isImpersonating,
  getImpersonationInfo,
  rejectIfImpersonating,
} from '@/lib/impersonation-guard'
import { cookies } from 'next/headers'

const mockCookies = vi.mocked(cookies)

function setupCookieStore(cookieValue?: string) {
  const store: Record<string, string> = {}
  if (cookieValue !== undefined) {
    store['civicos_impersonation'] = cookieValue
  }

  mockCookies.mockResolvedValue({
    has: vi.fn((name: string) => name in store),
    get: vi.fn((name: string) =>
      name in store ? { name, value: store[name] } : undefined
    ),
  } as any)
}

describe('impersonation-guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isImpersonating', () => {
    it('returns false when no cookie', async () => {
      setupCookieStore()
      expect(await isImpersonating()).toBe(false)
    })

    it('returns true when cookie exists', async () => {
      setupCookieStore('{"admin_id":"admin-1"}')
      expect(await isImpersonating()).toBe(true)
    })
  })

  describe('getImpersonationInfo', () => {
    it('returns null when no cookie', async () => {
      setupCookieStore()
      expect(await getImpersonationInfo()).toBeNull()
    })

    it('returns parsed data when valid cookie', async () => {
      const data = {
        admin_id: 'admin-1',
        admin_email: 'admin@test.com',
        tenant_id: 'tenant-1',
      }
      setupCookieStore(JSON.stringify(data))

      const result = await getImpersonationInfo()
      expect(result).toEqual(data)
    })

    it('returns null when invalid JSON', async () => {
      setupCookieStore('not-valid-json{{{')
      expect(await getImpersonationInfo()).toBeNull()
    })
  })

  describe('rejectIfImpersonating', () => {
    it('returns null when not impersonating', async () => {
      setupCookieStore()
      const result = await rejectIfImpersonating()
      expect(result).toBeNull()
    })

    it('returns 403 response when impersonating', async () => {
      setupCookieStore('{"admin_id":"admin-1"}')

      const result = await rejectIfImpersonating()
      expect(result).not.toBeNull()

      const json = await result!.json()
      expect(result!.status).toBe(403)
      expect(json.error).toBe('Accion no permitida en modo soporte')
    })
  })
})
