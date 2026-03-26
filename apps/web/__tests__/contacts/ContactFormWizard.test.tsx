import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContactFormWizard } from '@/components/contacts/ContactFormWizard'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock GeoSelector to avoid fetch dependency
vi.mock('@/components/perfil/GeoSelector', () => ({
  GeoSelector: () => <div data-testid="geo-selector">GeoSelector Mock</div>,
}))

describe('ContactFormWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-id' }),
    })
  })

  it('renders step 1 (Datos básicos) by default', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    expect(screen.getByText('Datos básicos')).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument()
  })

  it('shows 4 step indicators', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    expect(screen.getByText('Datos básicos')).toBeInTheDocument()
    expect(screen.getByText('Ubicación')).toBeInTheDocument()
    expect(screen.getByText('Perfil político')).toBeInTheDocument()
    expect(screen.getByText('Adicional')).toBeInTheDocument()
  })

  it('shows navigation buttons', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    expect(screen.getByText('Anterior')).toBeInTheDocument()
    expect(screen.getByText('Siguiente')).toBeInTheDocument()
    expect(screen.getByText('Guardar borrador')).toBeInTheDocument()
  })

  it('disables Anterior button on step 1', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    const prevButton = screen.getByText('Anterior').closest('button')
    expect(prevButton).toBeDisabled()
  })

  it('shows sidebar with notes and tags', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    expect(screen.getByText('Notas')).toBeInTheDocument()
    expect(screen.getByText('Etiquetas')).toBeInTheDocument()
  })

  it('renders with initial data for edit mode', () => {
    render(
      <ContactFormWizard
        campaignId="camp-1"
        initialData={{ first_name: 'María', last_name: 'López', phone: '300123', document_type: 'CC', document_number: '123', status: 'supporter' }}
        contactId="edit-id"
      />
    )
    const nameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement
    expect(nameInput.value).toBe('María')
  })
})
