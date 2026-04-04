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

import { TenantFilters } from '@/components/admin/TenantFilters'

describe('TenantFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const key of [...mockSearchParams.keys()]) {
      mockSearchParams.delete(key)
    }
  })

  it('renders search input, plan select, and status select', () => {
    render(<TenantFilters />)

    expect(screen.getByPlaceholderText('Buscar organización...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Todos los planes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Todos los estados')).toBeInTheDocument()
  })

  it('renders all plan options', () => {
    render(<TenantFilters />)

    const select = screen.getByDisplayValue('Todos los planes')
    const options = select.querySelectorAll('option')
    expect(options.length).toBe(5)
    expect(options[1].textContent).toBe('Esencial')
    expect(options[2].textContent).toBe('Pro')
    expect(options[3].textContent).toBe('Campaign')
    expect(options[4].textContent).toBe('Enterprise')
  })

  it('renders all status options', () => {
    render(<TenantFilters />)

    const select = screen.getByDisplayValue('Todos los estados')
    const options = select.querySelectorAll('option')
    expect(options.length).toBe(5)
    expect(options[1].textContent).toBe('Activo')
    expect(options[2].textContent).toBe('Trial')
    expect(options[3].textContent).toBe('Suspendido')
    expect(options[4].textContent).toBe('Cancelado')
  })

  it('navigates when plan filter changes', async () => {
    const user = userEvent.setup()
    render(<TenantFilters />)

    const select = screen.getByDisplayValue('Todos los planes')
    await user.selectOptions(select, 'pro')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/tenants?plan=pro')
  })

  it('navigates when status filter changes', async () => {
    const user = userEvent.setup()
    render(<TenantFilters />)

    const select = screen.getByDisplayValue('Todos los estados')
    await user.selectOptions(select, 'suspended')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/tenants?status=suspended')
  })

  it('removes param when "all" is selected', async () => {
    mockSearchParams.set('plan', 'pro')
    const user = userEvent.setup()
    render(<TenantFilters />)

    const select = screen.getByDisplayValue('Pro')
    await user.selectOptions(select, 'all')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/tenants?')
  })

  it('submits search on form submit', () => {
    render(<TenantFilters />)

    const input = screen.getByPlaceholderText('Buscar organización...')
    fireEvent.change(input, { target: { value: 'MiOrg' } })
    fireEvent.submit(input.closest('form')!)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/tenants?q=MiOrg')
  })

  it('deletes page param on any filter change', async () => {
    mockSearchParams.set('page', '5')
    const user = userEvent.setup()
    render(<TenantFilters />)

    const select = screen.getByDisplayValue('Todos los estados')
    await user.selectOptions(select, 'active')

    const pushedUrl = mockPush.mock.calls[0][0]
    expect(pushedUrl).not.toContain('page=')
  })

  it('initializes search input from search params', () => {
    mockSearchParams.set('q', 'PreLoaded')
    render(<TenantFilters />)

    expect(screen.getByDisplayValue('PreLoaded')).toBeInTheDocument()
  })

  it('preserves other params when changing one filter', async () => {
    mockSearchParams.set('plan', 'pro')
    const user = userEvent.setup()
    render(<TenantFilters />)

    const statusSelect = screen.getByDisplayValue('Todos los estados')
    await user.selectOptions(statusSelect, 'active')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/tenants?plan=pro&status=active')
  })
})
