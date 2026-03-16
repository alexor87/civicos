import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AIChatPanel } from '@/components/dashboard/ai/AIChatPanel'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock crypto.randomUUID
let uuidCount = 0
vi.stubGlobal('crypto', { randomUUID: () => `uuid-${uuidCount++}` })

const mockFetch = vi.fn()
global.fetch = mockFetch

function makeStreamResponse(text: string) {
  const encoder = new TextEncoder()
  const chunks = [encoder.encode(text)]
  let i = 0
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: vi.fn().mockImplementation(() =>
          i < chunks.length
            ? Promise.resolve({ done: false, value: chunks[i++] })
            : Promise.resolve({ done: true, value: undefined })
        ),
      }),
    },
  }
}

const DEFAULT_PROPS = {
  campaignId: 'camp1',
  campaignName: 'Rionegro Avanza',
  recentSuggestions: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  uuidCount = 0
})

describe('AIChatPanel', () => {
  it('renders empty state with campaign name', () => {
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    expect(screen.getByText(/Rionegro Avanza/)).toBeInTheDocument()
  })

  it('renders input field and send button', () => {
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    expect(screen.getByPlaceholderText(/escribe tu pregunta/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument()
  })

  it('Send button is disabled when input is empty', () => {
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /enviar/i })).toBeDisabled()
  })

  it('Send button enabled after typing', async () => {
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    await userEvent.type(screen.getByPlaceholderText(/escribe tu pregunta/i), 'Hola')
    expect(screen.getByRole('button', { name: /enviar/i })).not.toBeDisabled()
  })

  it('renders recent suggestions as context chips', () => {
    render(<AIChatPanel
      {...DEFAULT_PROPS}
      recentSuggestions={[{ priority: 'high', title: 'Alerta visitas' }]}
    />)
    expect(screen.getByText('Alerta visitas')).toBeInTheDocument()
  })

  it('appends user message after sending', async () => {
    mockFetch.mockResolvedValue(makeStreamResponse('Respuesta IA'))
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    await userEvent.type(screen.getByPlaceholderText(/escribe tu pregunta/i), 'Mi pregunta')
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => expect(screen.getByText('Mi pregunta')).toBeInTheDocument())
  })

  it('calls POST /api/ai/chat with message', async () => {
    mockFetch.mockResolvedValue(makeStreamResponse('ok'))
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    await userEvent.type(screen.getByPlaceholderText(/escribe tu pregunta/i), 'Test')
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai/chat',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('camp1'),
      })
    ))
  })

  it('shows streamed response in assistant bubble', async () => {
    mockFetch.mockResolvedValue(makeStreamResponse('Respuesta streaming'))
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    await userEvent.type(screen.getByPlaceholderText(/escribe tu pregunta/i), 'Pregunta')
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => expect(screen.getByText('Respuesta streaming')).toBeInTheDocument())
  })

  it('input is cleared after sending', async () => {
    mockFetch.mockResolvedValue(makeStreamResponse('ok'))
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    const input = screen.getByPlaceholderText(/escribe tu pregunta/i) as HTMLTextAreaElement
    await userEvent.type(input, 'Test')
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => expect(input.value).toBe(''))
  })

  it('shows error message and toast on fetch error', async () => {
    const { toast } = await import('sonner')
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Server error' }) })
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    await userEvent.type(screen.getByPlaceholderText(/escribe tu pregunta/i), 'Test')
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
      expect(screen.getByText(/Error al obtener respuesta/)).toBeInTheDocument()
    })
  })

  it('pressing Enter in textarea triggers send', async () => {
    mockFetch.mockResolvedValue(makeStreamResponse('ok'))
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    const input = screen.getByPlaceholderText(/escribe tu pregunta/i)
    await userEvent.type(input, 'Test{Enter}')
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
  })

  it('renders starter questions when no messages', () => {
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    expect(screen.getByText(/estado actual de la campaña/i)).toBeInTheDocument()
  })

  it('clicking a starter question sends it', async () => {
    mockFetch.mockResolvedValue(makeStreamResponse('ok'))
    render(<AIChatPanel {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByText(/estado actual de la campaña/i))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
  })
})
