import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useImpersonation } from '@/lib/hooks/useImpersonation'

describe('useImpersonation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('returns isImpersonating: false when no sessionStorage data', () => {
    const { result } = renderHook(() => useImpersonation())
    expect(result.current.isImpersonating).toBe(false)
    expect(result.current.adminEmail).toBeNull()
    expect(result.current.expiresAt).toBeNull()
  })

  it('returns impersonation data when sessionStorage is set', () => {
    const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const data = {
      admin_id: 'admin-1',
      admin_email: 'admin@scrutix.co',
      tenant_id: 'tenant-123',
      tenant_name: 'Campaña Test',
      session_id: 'session-abc',
      started_at: new Date().toISOString(),
      expires_at,
    }
    sessionStorage.setItem('impersonation', JSON.stringify(data))

    const { result } = renderHook(() => useImpersonation())
    expect(result.current.isImpersonating).toBe(true)
    expect(result.current.adminEmail).toBe('admin@scrutix.co')
    expect(result.current.tenantId).toBe('tenant-123')
    expect(result.current.tenantName).toBe('Campaña Test')
    expect(result.current.sessionId).toBe('session-abc')
    expect(result.current.expiresAt).toBe(expires_at)
  })

  it('returns isImpersonating: false when session has expired', () => {
    const data = {
      admin_id: 'admin-1',
      admin_email: 'admin@scrutix.co',
      tenant_id: 'tenant-123',
      tenant_name: 'Test',
      session_id: 'session-abc',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() - 1000).toISOString(),
    }
    sessionStorage.setItem('impersonation', JSON.stringify(data))

    const { result } = renderHook(() => useImpersonation())
    expect(result.current.isImpersonating).toBe(false)
  })

  it('handles invalid JSON gracefully', () => {
    sessionStorage.setItem('impersonation', 'not-valid-json')

    const { result } = renderHook(() => useImpersonation())
    expect(result.current.isImpersonating).toBe(false)
  })
})
