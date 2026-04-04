import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

import { ImpersonationBanner } from '@/components/impersonation/ImpersonationBanner'
import { createClient } from '@/lib/supabase/client'

const mockCreateClient = vi.mocked(createClient)

const mockImpersonationData = {
  admin_id: 'admin-1',
  admin_email: 'admin@test.com',
  tenant_id: 'tenant-1',
  tenant_name: 'Municipio Test',
  session_id: 'session-1',
  started_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min from now
}

function setupSessionStorage(data: Record<string, unknown> | null) {
  const store: Record<string, string> = {}
  if (data) {
    store['impersonation'] = JSON.stringify(data)
  }

  const mockStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(),
    length: Object.keys(store).length,
    key: vi.fn(),
  }

  Object.defineProperty(window, 'sessionStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  })

  return mockStorage
}

describe('ImpersonationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    Object.defineProperty(window, 'close', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null when no sessionStorage data', () => {
    setupSessionStorage(null)

    const { container } = render(<ImpersonationBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('renders banner with tenant name and admin email when data exists', async () => {
    setupSessionStorage(mockImpersonationData)

    await act(async () => {
      render(<ImpersonationBanner />)
    })

    expect(screen.getByText(/Municipio Test/)).toBeDefined()
    expect(screen.getByText(/admin@test.com/)).toBeDefined()
    expect(screen.getByText('Salir')).toBeDefined()
  })

  it('shows countdown timer', async () => {
    setupSessionStorage(mockImpersonationData)

    await act(async () => {
      render(<ImpersonationBanner />)
    })

    // Should display a time like "14:59" or "15:00"
    const timerElement = screen.getByText(/\d+:\d{2}/)
    expect(timerElement).toBeDefined()
  })

  it('calls signOut and fetch end-impersonation on exit click', async () => {
    setupSessionStorage(mockImpersonationData)

    const mockSignOut = vi.fn().mockResolvedValue({})
    mockCreateClient.mockReturnValue({
      auth: { signOut: mockSignOut },
    } as any)

    await act(async () => {
      render(<ImpersonationBanner />)
    })

    const exitButton = screen.getByText('Salir')

    await act(async () => {
      fireEvent.click(exitButton)
    })

    expect(mockSignOut).toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/end-impersonation',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('auto-exits when session is expired', async () => {
    const expiredData = {
      ...mockImpersonationData,
      expires_at: new Date(Date.now() - 1000).toISOString(), // already expired
    }
    const mockStorage = setupSessionStorage(expiredData)

    const mockSignOut = vi.fn().mockResolvedValue({})
    mockCreateClient.mockReturnValue({
      auth: { signOut: mockSignOut },
    } as any)

    await act(async () => {
      render(<ImpersonationBanner />)
    })

    // Should have attempted cleanup (removeItem called)
    expect(mockStorage.removeItem).toHaveBeenCalledWith('impersonation')
  })
})
