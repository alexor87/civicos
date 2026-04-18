import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { StepEssentials } from '@/components/contacts/steps/StepEssentials'
import type { ContactForm } from '@/lib/schemas/contact-form'

const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock fetch for duplicate check
const mockFetch = vi.fn()
global.fetch = mockFetch

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<ContactForm>({
    defaultValues: {
      first_name: '', last_name: '', document_type: 'CC',
      document_number: '', phone: '', status: 'unknown',
    },
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('StepEssentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ duplicate: false }),
    })
  })

  it('renders name fields', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument()
  })

  it('renders document fields', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/tipo doc/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/número de documento/i)).toBeInTheDocument()
  })

  it('renders phone field', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/teléfono móvil/i)).toBeInTheDocument()
  })

  it('renders status buttons', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByText('Simpatizante')).toBeInTheDocument()
    expect(screen.getByText('Indeciso')).toBeInTheDocument()
    expect(screen.getByText('Opositor')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('renders email field as required', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
  })

  it('renders collapsible phone alternate section', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByText(/teléfono alterno/i)).toBeInTheDocument()
  })

  // ── Merge / duplicate detection tests ─────────────────────────────

  it('shows merge button when duplicate detected on blur', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        duplicate: true,
        contact: { id: 'dup-id', first_name: 'Juan', last_name: 'García' },
      }),
    })

    render(<StepEssentials campaignId="camp-1" contactId="current-id" />, { wrapper: Wrapper })

    const docInput = screen.getByLabelText(/número de documento/i)
    fireEvent.change(docInput, { target: { value: '123456' } })
    fireEvent.blur(docInput)

    await waitFor(() => {
      expect(screen.getByText(/ya existe/i)).toBeInTheDocument()
      expect(screen.getByText(/Juan García/i)).toBeInTheDocument()
      expect(screen.getByText(/fusionar contactos/i)).toBeInTheDocument()
    })
  })

  it('does not show merge button when no contactId (new contact)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        duplicate: true,
        contact: { id: 'dup-id', first_name: 'Juan', last_name: 'García' },
      }),
    })

    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })

    const docInput = screen.getByLabelText(/número de documento/i)
    fireEvent.change(docInput, { target: { value: '123456' } })
    fireEvent.blur(docInput)

    await waitFor(() => {
      expect(screen.getByText(/ya existe/i)).toBeInTheDocument()
    })

    expect(screen.queryByText(/fusionar contactos/i)).not.toBeInTheDocument()
  })

  it('clears duplicate warning when no match', async () => {
    // First: show duplicate
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        duplicate: true,
        contact: { id: 'dup-id', first_name: 'Juan', last_name: 'García' },
      }),
    })

    render(<StepEssentials campaignId="camp-1" contactId="current-id" />, { wrapper: Wrapper })

    const docInput = screen.getByLabelText(/número de documento/i)
    fireEvent.change(docInput, { target: { value: '123456' } })
    fireEvent.blur(docInput)

    await waitFor(() => {
      expect(screen.getByText(/ya existe/i)).toBeInTheDocument()
    })

    // Then: clear by entering non-duplicate
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ duplicate: false }),
    })

    fireEvent.change(docInput, { target: { value: '999999' } })
    fireEvent.blur(docInput)

    await waitFor(() => {
      expect(screen.queryByText(/ya existe/i)).not.toBeInTheDocument()
    })
  })

  it('calls merge API and redirects on success', async () => {
    // Setup: detect duplicate first
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        duplicate: true,
        contact: { id: 'target-id', first_name: 'Juan', last_name: 'García' },
      }),
    })

    render(<StepEssentials campaignId="camp-1" contactId="source-id" />, { wrapper: Wrapper })

    const docInput = screen.getByLabelText(/número de documento/i)
    fireEvent.change(docInput, { target: { value: '123456' } })
    fireEvent.blur(docInput)

    await waitFor(() => {
      expect(screen.getByText(/fusionar contactos/i)).toBeInTheDocument()
    })

    // Setup merge response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, mergedId: 'target-id' }),
    })

    fireEvent.click(screen.getByText(/fusionar contactos/i))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contacts/merge', expect.objectContaining({
        method: 'POST',
      }))
      expect(mockPush).toHaveBeenCalledWith('/dashboard/contacts/target-id')
    })
  })

  it('passes exclude_id to check-duplicate when contactId provided', async () => {
    render(<StepEssentials campaignId="camp-1" contactId="my-contact-id" />, { wrapper: Wrapper })

    const docInput = screen.getByLabelText(/número de documento/i)
    fireEvent.change(docInput, { target: { value: '123456' } })
    fireEvent.blur(docInput)

    await waitFor(() => {
      const fetchUrl = mockFetch.mock.calls[0][0] as string
      expect(fetchUrl).toContain('exclude_id=my-contact-id')
    })
  })
})
