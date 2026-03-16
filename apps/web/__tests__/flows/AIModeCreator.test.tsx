import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIModeCreator } from '@/components/dashboard/flows/AIModeCreator'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const mockGenerateResponse = {
  flowConfig: {
    name:            'Saludo de cumpleaños por WhatsApp',
    category:        'birthday',
    icon:            '🎂',
    trigger_config:  { type: 'date_field', config: { field: 'birth_date', offset_days: 0, time: '08:00' } },
    filter_config:   [],
    actions_config:  [{ type: 'send_whatsapp', config: { message: '¡Feliz cumpleaños, {first_name}!', fallback: 'sms' } }],
    human_summary:   'Envía un WhatsApp de cumpleaños a cada contacto el día de su cumpleaños.',
    clarifying_questions: [],
  },
  previewContact: {
    id:        'contact-1',
    name:      'María García',
    barrio:    'Cuatro Esquinas',
    municipio: 'Rionegro',
  },
  renderedMessage: '¡Feliz cumpleaños, María!',
}

describe('AIModeCreator', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('renderiza el campo de texto de entrada', () => {
    render(<AIModeCreator />)
    expect(screen.getByTestId('ai-input')).toBeInTheDocument()
  })

  it('muestra sugerencias de ejemplo', () => {
    render(<AIModeCreator />)
    expect(screen.getByText(/cumpleaños/i)).toBeInTheDocument()
  })

  it('renderiza el botón de generar', () => {
    render(<AIModeCreator />)
    expect(screen.getByTestId('generate-btn')).toBeInTheDocument()
  })

  it('el botón de generar está deshabilitado si no hay texto', () => {
    render(<AIModeCreator />)
    expect(screen.getByTestId('generate-btn')).toBeDisabled()
  })

  it('habilita el botón al escribir texto', () => {
    render(<AIModeCreator />)
    fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Enviar cumpleaños' } })
    expect(screen.getByTestId('generate-btn')).not.toBeDisabled()
  })

  it('muestra spinner durante la generación', async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockGenerateResponse,
      }), 100))
    )
    vi.stubGlobal('fetch', mockFetch)

    render(<AIModeCreator />)
    fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Enviar cumpleaños' } })
    fireEvent.click(screen.getByTestId('generate-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('generating-spinner')).toBeInTheDocument()
    })
  })

  it('muestra FlowRecipeCard después de generar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGenerateResponse,
    }))

    render(<AIModeCreator />)
    fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Enviar cumpleaños' } })
    fireEvent.click(screen.getByTestId('generate-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('flow-recipe-card')).toBeInTheDocument()
    })
  })

  it('muestra FlowPreview con el contacto de ejemplo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGenerateResponse,
    }))

    render(<AIModeCreator />)
    fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Enviar cumpleaños' } })
    fireEvent.click(screen.getByTestId('generate-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('flow-preview')).toBeInTheDocument()
    })
  })

  it('muestra los botones de guardar/activar después de generar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGenerateResponse,
    }))

    render(<AIModeCreator />)
    fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Enviar cumpleaños' } })
    fireEvent.click(screen.getByTestId('generate-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('save-draft-btn')).toBeInTheDocument()
      expect(screen.getByTestId('activate-btn')).toBeInTheDocument()
    })
  })

  it('llama a POST /api/flows al guardar borrador', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockGenerateResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-flow-id', status: 'draft' }) })

    vi.stubGlobal('fetch', mockFetch)

    render(<AIModeCreator />)
    fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Enviar cumpleaños' } })
    fireEvent.click(screen.getByTestId('generate-btn'))

    await waitFor(() => screen.getByTestId('save-draft-btn'))
    fireEvent.click(screen.getByTestId('save-draft-btn'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/flows',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('rellena el campo de nombre con el nombre sugerido por la IA', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGenerateResponse,
    }))

    render(<AIModeCreator />)
    fireEvent.change(screen.getByTestId('ai-input'), { target: { value: 'Enviar cumpleaños' } })
    fireEvent.click(screen.getByTestId('generate-btn'))

    await waitFor(() => {
      const nameInput = screen.getByTestId('flow-name-input') as HTMLInputElement
      expect(nameInput.value).toBe('Saludo de cumpleaños por WhatsApp')
    })
  })
})
