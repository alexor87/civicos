import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ImpersonationBanner } from '@/components/impersonation/ImpersonationBanner'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}))

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }),
}))

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) })

describe('ImpersonationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders nothing when no impersonation data in sessionStorage', () => {
    const { container } = render(<ImpersonationBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('renders banner when impersonation data is present in sessionStorage', () => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const data = {
      admin_id: 'admin-123',
      admin_email: 'soporte@scrutix.co',
      tenant_id: 'tenant-456',
      tenant_name: 'Campaña Test',
      session_id: 'sess-xyz',
      started_at: new Date().toISOString(),
      expires_at: expiresAt,
    }
    sessionStorage.setItem('impersonation', JSON.stringify(data))

    render(<ImpersonationBanner />)

    expect(screen.getByText(/Modo soporte/)).toBeTruthy()
    expect(screen.getByText(/soporte@scrutix.co/)).toBeTruthy()
    expect(screen.getByText('Salir')).toBeTruthy()
  })

  it('shows tenant name in banner', () => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const data = {
      admin_id: 'admin-123',
      admin_email: 'soporte@scrutix.co',
      tenant_id: 'tenant-456',
      tenant_name: 'Mi Tenant',
      session_id: 'sess-xyz',
      started_at: new Date().toISOString(),
      expires_at: expiresAt,
    }
    sessionStorage.setItem('impersonation', JSON.stringify(data))

    render(<ImpersonationBanner />)

    expect(screen.getByText(/Mi Tenant/)).toBeTruthy()
  })

  it('shows countdown timer', async () => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const data = {
      admin_id: 'admin-123',
      admin_email: 'admin@scrutix.co',
      tenant_id: 'tenant-789',
      tenant_name: 'Test',
      session_id: 'sess-timer',
      started_at: new Date().toISOString(),
      expires_at: expiresAt,
    }
    sessionStorage.setItem('impersonation', JSON.stringify(data))

    render(<ImpersonationBanner />)

    // Timer should show approximately 4:59 or 5:00
    await vi.waitFor(() => {
      const timerEl = screen.getByText(/\d+:\d{2}/)
      expect(timerEl).toBeTruthy()
    })
  })
})
