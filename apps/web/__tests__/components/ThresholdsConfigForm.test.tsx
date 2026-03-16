import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThresholdsConfigForm } from '@/components/dashboard/ai/ThresholdsConfigForm'
import { DEFAULT_AGENT_THRESHOLDS } from '@/lib/agents/thresholds'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

const DEFAULT_PROPS = {
  campaignId: 'camp1',
  initialThresholds: { ...DEFAULT_AGENT_THRESHOLDS },
}

describe('ThresholdsConfigForm', () => {
  it('renders all 5 threshold input fields', () => {
    render(<ThresholdsConfigForm {...DEFAULT_PROPS} />)
    expect(screen.getByLabelText(/caída de visitas/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cobertura baja/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mínimo voluntarios/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/días sin contacto/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/borrador pendiente/i)).toBeInTheDocument()
  })

  it('inputs are pre-filled with initialThresholds values', () => {
    render(<ThresholdsConfigForm {...DEFAULT_PROPS} />)
    const visitDropInput = screen.getByLabelText(/caída de visitas/i) as HTMLInputElement
    expect(visitDropInput.value).toBe('20')
  })

  it('changing an input updates its value', () => {
    render(<ThresholdsConfigForm {...DEFAULT_PROPS} />)
    const input = screen.getByLabelText(/caída de visitas/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '30' } })
    expect(input.value).toBe('30')
  })

  it('clicking Save sends PATCH to /api/campaigns/thresholds with correct body', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    render(<ThresholdsConfigForm {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/api/campaigns/thresholds',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"campaign_id":"camp1"'),
      })
    ))
  })

  it('shows toast.success on 200 response', async () => {
    const { toast } = await import('sonner')
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    render(<ThresholdsConfigForm {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Configuración guardada'))
  })

  it('shows toast.error on error response', async () => {
    const { toast } = await import('sonner')
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Forbidden' }) })
    render(<ThresholdsConfigForm {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Forbidden'))
  })

  it('Save button shows loading state during fetch', async () => {
    let resolve: (v: unknown) => void
    const pending = new Promise(r => { resolve = r })
    mockFetch.mockReturnValue(pending)
    render(<ThresholdsConfigForm {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled()
    resolve!({ ok: true, json: async () => ({ success: true }) })
  })
})
