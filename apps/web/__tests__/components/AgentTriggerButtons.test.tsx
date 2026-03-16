import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentTriggerButtons } from '@/components/dashboard/ai/AgentTriggerButtons'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AgentTriggerButtons', () => {
  it('renders 3 agent buttons', () => {
    render(<AgentTriggerButtons onRunComplete={vi.fn()} />)
    const buttons = screen.getAllByRole('button', { name: /ejecutar/i })
    expect(buttons).toHaveLength(3)
  })

  it('renders correct agent labels', () => {
    render(<AgentTriggerButtons onRunComplete={vi.fn()} />)
    expect(screen.getByText('Monitor de campaña')).toBeInTheDocument()
    expect(screen.getByText('Comunicaciones inteligentes')).toBeInTheDocument()
    expect(screen.getByText('Redistribución de territorio')).toBeInTheDocument()
  })

  it('disables all buttons while one agent is running', async () => {
    let resolve: (v: unknown) => void
    const pending = new Promise(r => { resolve = r })
    mockFetch.mockReturnValue(pending)
    render(<AgentTriggerButtons onRunComplete={vi.fn()} />)
    fireEvent.click(screen.getByLabelText(/Ejecutar Monitor/i))
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      buttons.forEach(btn => expect(btn).toBeDisabled())
    })
    resolve!({ ok: true, json: async () => ({}) })
  })

  it('calls fetch with correct endpoint for Monitor de campaña', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    render(<AgentTriggerButtons onRunComplete={vi.fn()} />)
    fireEvent.click(screen.getByLabelText(/Ejecutar Monitor/i))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/api/agents/campaign-monitor',
      expect.objectContaining({ method: 'POST' })
    ))
  })

  it('calls fetch with correct endpoint for Comunicaciones inteligentes', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    render(<AgentTriggerButtons onRunComplete={vi.fn()} />)
    fireEvent.click(screen.getByLabelText(/Ejecutar Comunicaciones/i))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/api/agents/smart-comms',
      expect.objectContaining({ method: 'POST' })
    ))
  })

  it('calls fetch with correct endpoint for Redistribución', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    render(<AgentTriggerButtons onRunComplete={vi.fn()} />)
    fireEvent.click(screen.getByLabelText(/Ejecutar Redistribución/i))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/api/agents/territory-redistribution',
      expect.objectContaining({ method: 'POST' })
    ))
  })

  it('shows toast.success and calls onRunComplete on success', async () => {
    const { toast } = await import('sonner')
    const onRunComplete = vi.fn()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    render(<AgentTriggerButtons onRunComplete={onRunComplete} />)
    fireEvent.click(screen.getByLabelText(/Ejecutar Monitor/i))
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
      expect(onRunComplete).toHaveBeenCalledTimes(1)
    })
  })

  it('shows toast.error on non-ok response', async () => {
    const { toast } = await import('sonner')
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Unauthorized' }) })
    render(<AgentTriggerButtons onRunComplete={vi.fn()} />)
    fireEvent.click(screen.getByLabelText(/Ejecutar Monitor/i))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Unauthorized'))
  })

  it('clears loading state after completion', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    render(<AgentTriggerButtons onRunComplete={vi.fn()} />)
    fireEvent.click(screen.getByLabelText(/Ejecutar Monitor/i))
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      buttons.forEach(btn => expect(btn).not.toBeDisabled())
    })
  })
})
