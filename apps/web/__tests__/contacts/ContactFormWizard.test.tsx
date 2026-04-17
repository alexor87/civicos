import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContactFormWizard } from '@/components/contacts/ContactFormWizard'
import { useContactFormStore } from '@/lib/stores/contact-form-store'

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
    useContactFormStore.setState(useContactFormStore.getInitialState())
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-id' }),
    })
  })

  it('shows level selector when creating a new contact', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    expect(screen.getByText('¿Qué tipo de contacto vas a registrar?')).toBeInTheDocument()
    expect(screen.getByText('Completo')).toBeInTheDocument()
    expect(screen.getByText('Opinión')).toBeInTheDocument()
    expect(screen.getByText('Anónimo')).toBeInTheDocument()
  })

  it('shows step 1 after selecting completo level', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    fireEvent.click(screen.getByText('Completo'))
    expect(screen.getByText('Datos básicos')).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
  })

  it('shows 4 step indicators for completo level', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    fireEvent.click(screen.getByText('Completo'))
    expect(screen.getByText('Datos básicos')).toBeInTheDocument()
    expect(screen.getByText('Ubicación')).toBeInTheDocument()
    expect(screen.getByText('Perfil político')).toBeInTheDocument()
    expect(screen.getByText('Adicional')).toBeInTheDocument()
  })

  it('shows 3 step indicators for opinion level', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    fireEvent.click(screen.getByText('Opinión'))
    expect(screen.getByText('Datos básicos')).toBeInTheDocument()
    expect(screen.getByText('Ubicación')).toBeInTheDocument()
    expect(screen.getByText('Perfil político')).toBeInTheDocument()
    expect(screen.queryByText('Adicional')).not.toBeInTheDocument()
  })

  it('shows 2 step indicators for anonimo level', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    fireEvent.click(screen.getByText('Anónimo'))
    expect(screen.getByText('Perfil político')).toBeInTheDocument()
    expect(screen.getByText('Ubicación')).toBeInTheDocument()
    expect(screen.queryByText('Datos básicos')).not.toBeInTheDocument()
    expect(screen.queryByText('Adicional')).not.toBeInTheDocument()
  })

  it('shows navigation buttons after level selection', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    fireEvent.click(screen.getByText('Completo'))
    expect(screen.getByText('Cambiar tipo')).toBeInTheDocument()
    expect(screen.getByText('Siguiente')).toBeInTheDocument()
    expect(screen.getByText('Guardar borrador')).toBeInTheDocument()
  })

  it('shows sidebar with notes, tags and level badge', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    fireEvent.click(screen.getByText('Completo'))
    expect(screen.getByText('Notas')).toBeInTheDocument()
    expect(screen.getByText('Etiquetas')).toBeInTheDocument()
  })

  it('renders with initial data for edit mode (skips level selector)', () => {
    render(
      <ContactFormWizard
        campaignId="camp-1"
        initialData={{ first_name: 'María', last_name: 'López', phone: '300123', document_type: 'CC', document_number: '123', status: 'supporter' }}
        contactId="edit-id"
        initialLevel="completo"
      />
    )
    // Should skip level selector and show step 1 directly
    expect(screen.queryByText('¿Qué tipo de contacto vas a registrar?')).not.toBeInTheDocument()
    const nameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement
    expect(nameInput.value).toBe('María')
  })

  it('can go back to level selector from step 1', () => {
    render(<ContactFormWizard campaignId="camp-1" />)
    fireEvent.click(screen.getByText('Completo'))
    expect(screen.getByText('Datos básicos')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cambiar tipo'))
    expect(screen.getByText('¿Qué tipo de contacto vas a registrar?')).toBeInTheDocument()
  })
})
