import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteRoleDialog } from '@/components/settings/DeleteRoleDialog'

const MOCK_ROLE = { id: 'custom-1', name: 'Custom Role', slug: 'custom-role', description: null, color: '#6366F1', is_system: false, base_role_key: null, member_count: 2 }
const ALL_ROLES = [
  MOCK_ROLE,
  { id: 'r1', name: 'Voluntario', slug: 'voluntario', description: null, color: '#D97706', is_system: true, base_role_key: 'volunteer', member_count: 3 },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DeleteRoleDialog', () => {
  it('shows member warning when role has members', () => {
    render(<DeleteRoleDialog role={MOCK_ROLE} roles={ALL_ROLES} open={true} onClose={vi.fn()} onDeleted={vi.fn()} />)
    expect(screen.getByText(/2 miembros asignados/)).toBeInTheDocument()
  })

  it('requires reassignment selection when role has members', () => {
    render(<DeleteRoleDialog role={MOCK_ROLE} roles={ALL_ROLES} open={true} onClose={vi.fn()} onDeleted={vi.fn()} />)
    const deleteBtn = screen.getByText('Eliminar rol')
    expect(deleteBtn).toBeDisabled()
  })

  it('calls API on delete', async () => {
    const user = userEvent.setup()
    const onDeleted = vi.fn()
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) })
    global.fetch = mockFetch

    render(<DeleteRoleDialog role={MOCK_ROLE} roles={ALL_ROLES} open={true} onClose={vi.fn()} onDeleted={onDeleted} />)

    // Select reassignment role
    const select = screen.getByDisplayValue('Seleccionar rol...')
    await user.selectOptions(select, 'r1')
    await user.click(screen.getByText('Eliminar rol'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/roles/custom-1', expect.objectContaining({ method: 'DELETE' }))
    })
  })
})
