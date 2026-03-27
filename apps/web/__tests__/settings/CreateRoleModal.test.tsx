import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateRoleModal } from '@/components/settings/CreateRoleModal'

const MOCK_ROLES = [
  { id: 'r1', name: 'Voluntario', slug: 'voluntario', description: null, color: '#D97706', is_system: true, base_role_key: 'volunteer', member_count: 3 },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CreateRoleModal', () => {
  it('renders form when open', () => {
    render(<CreateRoleModal open={true} onClose={vi.fn()} onCreated={vi.fn()} existingRoles={MOCK_ROLES} />)
    expect(screen.getByText('Crear nuevo rol')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre *')).toBeInTheDocument()
  })

  it('shows validation error for short name', async () => {
    const user = userEvent.setup()
    render(<CreateRoleModal open={true} onClose={vi.fn()} onCreated={vi.fn()} existingRoles={MOCK_ROLES} />)

    const input = screen.getByLabelText('Nombre *')
    await user.type(input, 'AB')
    await user.click(screen.getByText('Crear rol'))

    expect(screen.getByText('El nombre debe tener al menos 3 caracteres')).toBeInTheDocument()
  })

  it('calls API on valid submit', async () => {
    const user = userEvent.setup()
    const onCreated = vi.fn()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-1', name: 'Test Role', slug: 'test-role', color: '#6366F1', is_system: false, base_role_key: null, description: null, member_count: 0 }),
    })
    global.fetch = mockFetch

    render(<CreateRoleModal open={true} onClose={vi.fn()} onCreated={onCreated} existingRoles={MOCK_ROLES} />)

    const input = screen.getByLabelText('Nombre *')
    await user.type(input, 'Test Role')
    await user.click(screen.getByText('Crear rol'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/roles', expect.objectContaining({ method: 'POST' }))
      expect(onCreated).toHaveBeenCalled()
    })
  })
})
