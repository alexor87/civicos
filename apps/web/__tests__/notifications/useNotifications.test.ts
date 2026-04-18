import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNotifications } from '@/hooks/useNotifications'

// Mock Supabase client
const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
const mockChannel = vi.fn().mockReturnValue({ on: mockOn })
const mockRemoveChannel = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}))

const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    tenant_id: 't1',
    campaign_id: 'c1',
    user_id: 'u1',
    type: 'new_contact',
    title: 'Nuevo contacto',
    body: null,
    link: '/dashboard/contacts',
    read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'n2',
    tenant_id: 't1',
    campaign_id: 'c1',
    user_id: 'u1',
    type: 'system',
    title: 'Alerta del sistema',
    body: 'Mantenimiento programado',
    link: null,
    read: true,
    created_at: new Date().toISOString(),
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
})

describe('useNotifications', () => {
  it('fetches notifications on mount', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ notifications: MOCK_NOTIFICATIONS, unread_count: 1 }),
    })

    const { result } = renderHook(() => useNotifications('u1'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.unreadCount).toBe(1)
    expect(global.fetch).toHaveBeenCalledWith('/api/notifications?limit=20')
  })

  it('does not fetch if userId is undefined', () => {
    renderHook(() => useNotifications(undefined))
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('subscribes to realtime channel', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ notifications: [], unread_count: 0 }),
    })

    renderHook(() => useNotifications('u1'))

    await waitFor(() => {
      expect(mockChannel).toHaveBeenCalledWith('notifications-u1')
    })
  })

  it('cleans up channel on unmount', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ notifications: [], unread_count: 0 }),
    })

    const { unmount } = renderHook(() => useNotifications('u1'))

    await waitFor(() => {
      expect(mockChannel).toHaveBeenCalled()
    })

    unmount()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })

  it('markAsRead optimistically updates state', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notifications: MOCK_NOTIFICATIONS, unread_count: 1 }),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) })

    const { result } = renderHook(() => useNotifications('u1'))

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2)
    })

    await act(async () => {
      await result.current.markAsRead('n1')
    })

    expect(result.current.notifications[0].read).toBe(true)
    expect(result.current.unreadCount).toBe(0)
  })

  it('markAllAsRead optimistically updates all', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notifications: MOCK_NOTIFICATIONS, unread_count: 1 }),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) })

    const { result } = renderHook(() => useNotifications('u1'))

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2)
    })

    await act(async () => {
      await result.current.markAllAsRead()
    })

    expect(result.current.unreadCount).toBe(0)
    expect(result.current.notifications.every(n => n.read)).toBe(true)
  })

  it('handles fetch error gracefully', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useNotifications('u1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.notifications).toEqual([])
  })
})
