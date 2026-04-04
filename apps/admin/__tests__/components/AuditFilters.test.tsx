import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

import { AuditFilters } from '@/components/admin/AuditFilters'

describe('AuditFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset search params
    for (const key of [...mockSearchParams.keys()]) {
      mockSearchParams.delete(key)
    }
  })

  it('renders the search input and action select', () => {
    render(<AuditFilters />)

    expect(screen.getByPlaceholderText('Buscar por organización...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Todas las acciones')).toBeInTheDocument()
  })

  it('renders all action options', () => {
    render(<AuditFilters />)

    const select = screen.getByDisplayValue('Todas las acciones')
    const options = select.querySelectorAll('option')
    expect(options.length).toBe(11)
    expect(options[0].textContent).toBe('Todas las acciones')
    expect(options[1].textContent).toBe('Tenant creado')
  })

  it('navigates when action filter changes', async () => {
    const user = userEvent.setup()
    render(<AuditFilters />)

    const select = screen.getByDisplayValue('Todas las acciones')
    await user.selectOptions(select, 'tenant_created')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/audit?action=tenant_created')
  })

  it('removes action param when "all" is selected', async () => {
    mockSearchParams.set('action', 'tenant_created')
    const user = userEvent.setup()
    render(<AuditFilters />)

    const select = screen.getByDisplayValue('Tenant creado')
    await user.selectOptions(select, 'all')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/audit?')
  })

  it('submits tenant search on form submit', () => {
    render(<AuditFilters />)

    const input = screen.getByPlaceholderText('Buscar por organización...')
    fireEvent.change(input, { target: { value: 'Acme' } })
    fireEvent.submit(input.closest('form')!)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/audit?tenant=Acme')
  })

  it('deletes page param on filter change', async () => {
    mockSearchParams.set('page', '3')
    const user = userEvent.setup()
    render(<AuditFilters />)

    const select = screen.getByDisplayValue('Todas las acciones')
    await user.selectOptions(select, 'plan_changed')

    const pushedUrl = mockPush.mock.calls[0][0]
    expect(pushedUrl).not.toContain('page=')
  })

  it('initializes tenant input from search params', () => {
    mockSearchParams.set('tenant', 'ExistingOrg')
    render(<AuditFilters />)

    expect(screen.getByDisplayValue('ExistingOrg')).toBeInTheDocument()
  })
})
