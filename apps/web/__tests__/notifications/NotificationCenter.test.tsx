import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationCenter } from '@/components/dashboard/NotificationCenter'

// Mock useNotifications
const mockMarkAsRead = vi.fn()
const mockMarkAllAsRead = vi.fn()
const mockRefresh = vi.fn()

let mockNotifications: any[] = []
let mockUnreadCount = 0
let mockLoading = false

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    loading: mockLoading,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    refresh: mockRefresh,
  }),
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const BASE_NOTIFICATION = {
  id: 'n1',
  tenant_id: 't1',
  campaign_id: 'c1',
  user_id: 'u1',
  type: 'new_contact' as const,
  title: 'Nuevo contacto registrado',
  body: 'Juan López se registró',
  link: '/dashboard/contacts',
  read: false,
  created_at: new Date().toISOString(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockNotifications = []
  mockUnreadCount = 0
  mockLoading = false
})

describe('NotificationCenter', () => {
  it('renders the bell icon', () => {
    render(<NotificationCenter userId="u1" />)
    // The bell icon trigger should be present
    const trigger = screen.getByRole('button')
    expect(trigger).toBeInTheDocument()
  })

  it('shows badge with unread count', () => {
    mockUnreadCount = 5
    render(<NotificationCenter userId="u1" />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows 99+ when unread count exceeds 99', () => {
    mockUnreadCount = 150
    render(<NotificationCenter userId="u1" />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('does not show badge when unread is 0', () => {
    mockUnreadCount = 0
    render(<NotificationCenter userId="u1" />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('does not show badge when notifications are disabled', () => {
    mockUnreadCount = 5
    render(<NotificationCenter userId="u1" notificationsEnabled={false} />)
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })

  it('shows empty state when no notifications', async () => {
    mockNotifications = []
    render(<NotificationCenter userId="u1" />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('No tienes notificaciones')).toBeInTheDocument()
    })
  })

  it('shows disabled message when notifications are off', async () => {
    render(<NotificationCenter userId="u1" notificationsEnabled={false} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Las notificaciones están desactivadas')).toBeInTheDocument()
    })
  })

  it('renders notification items', async () => {
    mockNotifications = [BASE_NOTIFICATION]
    mockUnreadCount = 1
    render(<NotificationCenter userId="u1" />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Nuevo contacto registrado')).toBeInTheDocument()
      expect(screen.getByText('Juan López se registró')).toBeInTheDocument()
    })
  })

  it('calls markAsRead and navigates on notification click', async () => {
    mockNotifications = [BASE_NOTIFICATION]
    mockUnreadCount = 1
    render(<NotificationCenter userId="u1" />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Nuevo contacto registrado')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Nuevo contacto registrado'))
    expect(mockMarkAsRead).toHaveBeenCalledWith('n1')
    expect(mockPush).toHaveBeenCalledWith('/dashboard/contacts')
  })

  it('does not navigate when notification has no link', async () => {
    mockNotifications = [{ ...BASE_NOTIFICATION, link: null }]
    mockUnreadCount = 1
    render(<NotificationCenter userId="u1" />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Nuevo contacto registrado')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Nuevo contacto registrado'))
    expect(mockMarkAsRead).toHaveBeenCalledWith('n1')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('calls markAllAsRead when button is clicked', async () => {
    mockNotifications = [BASE_NOTIFICATION]
    mockUnreadCount = 1
    render(<NotificationCenter userId="u1" />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Marcar todas como leídas')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Marcar todas como leídas'))
    expect(mockMarkAllAsRead).toHaveBeenCalled()
  })

  it('shows loading state', async () => {
    mockLoading = true
    render(<NotificationCenter userId="u1" />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    })
  })

  it('does not call markAsRead for already-read notification', async () => {
    mockNotifications = [{ ...BASE_NOTIFICATION, read: true }]
    render(<NotificationCenter userId="u1" />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Nuevo contacto registrado')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Nuevo contacto registrado'))
    expect(mockMarkAsRead).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/dashboard/contacts')
  })
})
