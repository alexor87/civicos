import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QuickAddModal } from '@/components/contacts/QuickAddModal'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

describe('QuickAddModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    campaignId: 'camp-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-id' }),
    })
  })

  it('renders the modal with form fields when open', () => {
    render(<QuickAddModal {...defaultProps} />)
    expect(screen.getByText('Captura rápida')).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
  })

  it('shows affinity selector', () => {
    render(<QuickAddModal {...defaultProps} />)
    expect(screen.getByText('Opositor')).toBeInTheDocument()
    expect(screen.getByText('Aliado')).toBeInTheDocument()
  })

  it('has save and save-and-add-another buttons', () => {
    render(<QuickAddModal {...defaultProps} />)
    expect(screen.getByText('Guardar contacto')).toBeInTheDocument()
    expect(screen.getByText('Guardar y agregar otro')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<QuickAddModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Captura rápida')).not.toBeInTheDocument()
  })

  it('validates required fields before submit', async () => {
    render(<QuickAddModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Guardar contacto'))
    // Should not call fetch if fields are empty
    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
