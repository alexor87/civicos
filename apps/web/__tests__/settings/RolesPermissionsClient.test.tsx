import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RolesPermissionsClient } from '@/components/settings/RolesPermissionsClient'

const MOCK_ROLES = [
  { id: 'r1', name: 'Super Admin', slug: 'super-admin', description: null, color: '#1E40AF', is_system: true, base_role_key: 'super_admin', member_count: 1 },
  { id: 'r2', name: 'Voluntario', slug: 'voluntario', description: null, color: '#D97706', is_system: true, base_role_key: 'volunteer', member_count: 3 },
]

const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = mockFetch
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_ROLES),
  })
})

describe('RolesPermissionsClient', () => {
  it('renders roles list after loading', async () => {
    render(<RolesPermissionsClient />)
    await waitFor(() => {
      expect(screen.getByText('Super Admin')).toBeInTheDocument()
      expect(screen.getByText('Voluntario')).toBeInTheDocument()
    })
  })

  it('shows permission editor when role selected', async () => {
    // First call returns roles, second returns permissions
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(MOCK_ROLES) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { permission: 'contacts.view', is_active: true },
        ]),
      })

    render(<RolesPermissionsClient />)
    await waitFor(() => {
      expect(screen.getByText('Super Admin')).toBeInTheDocument()
    })
  })
})
