import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GDPRActions } from '@/components/dashboard/contacts/GDPRActions'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock URL APIs for download test
global.URL.createObjectURL = vi.fn(() => 'blob:mock')
global.URL.revokeObjectURL = vi.fn()

const CONTACT_ID = 'contact-abc'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GDPRActions', () => {
  it('shows anonymized badge when isAnonymized=true', () => {
    render(<GDPRActions contactId={CONTACT_ID} isAnonymized />)
    expect(screen.getByText(/datos personales eliminados/i)).toBeInTheDocument()
  })

  it('hides action buttons when isAnonymized=true', () => {
    render(<GDPRActions contactId={CONTACT_ID} isAnonymized />)
    expect(screen.queryByRole('button', { name: /exportar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument()
  })

  it('shows export and delete buttons when not anonymized', () => {
    render(<GDPRActions contactId={CONTACT_ID} isAnonymized={false} />)
    expect(screen.getByRole('button', { name: /exportar datos/i })).toBeInTheDocument()
    expect(screen.getByTestId('gdpr-delete-trigger')).toBeInTheDocument()
  })

  it('calls GET endpoint when export button is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['{}'], { type: 'application/json' }),
    })
    render(<GDPRActions contactId={CONTACT_ID} isAnonymized={false} />)
    fireEvent.click(screen.getByRole('button', { name: /exportar datos/i }))
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(`/api/contacts/${CONTACT_ID}/personal-data`)
    )
  })

  it('shows error toast when export fails', async () => {
    const { toast } = await import('sonner')
    mockFetch.mockResolvedValue({ ok: false })
    render(<GDPRActions contactId={CONTACT_ID} isAnonymized={false} />)
    fireEvent.click(screen.getByRole('button', { name: /exportar datos/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  it('opens confirmation dialog when delete button is clicked', async () => {
    render(<GDPRActions contactId={CONTACT_ID} isAnonymized={false} />)
    fireEvent.click(screen.getByTestId('gdpr-delete-trigger'))
    await waitFor(() =>
      expect(screen.getByText(/¿eliminar datos personales\?/i)).toBeInTheDocument()
    )
  })

  it('calls DELETE endpoint after confirming', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    render(<GDPRActions contactId={CONTACT_ID} isAnonymized={false} />)
    fireEvent.click(screen.getByTestId('gdpr-delete-trigger'))
    await waitFor(() => screen.getByText(/¿eliminar datos personales\?/i))
    fireEvent.click(screen.getByRole('button', { name: /sí, eliminar datos/i }))
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/contacts/${CONTACT_ID}/personal-data`,
        expect.objectContaining({ method: 'DELETE' })
      )
    )
  })
})
