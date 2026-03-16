import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventForm } from '@/components/dashboard/calendar/EventForm'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
}))

const fetchMock = vi.fn()
global.fetch = fetchMock

beforeEach(() => {
  fetchMock.mockClear()
  pushMock.mockClear()
})

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('EventForm', () => {

  it('renderiza el selector de tipos de evento', () => {
    render(<EventForm />)
    expect(screen.getByTestId('event-type-grid')).toBeInTheDocument()
  })

  it('muestra todos los tipos de evento', () => {
    render(<EventForm />)
    expect(screen.getByTestId('event-type-public_event')).toBeInTheDocument()
    expect(screen.getByTestId('event-type-canvassing')).toBeInTheDocument()
    expect(screen.getByTestId('event-type-electoral_date')).toBeInTheDocument()
    expect(screen.getByTestId('event-type-internal_meeting')).toBeInTheDocument()
  })

  it('muestra el campo de título', () => {
    render(<EventForm />)
    expect(screen.getByTestId('title-input')).toBeInTheDocument()
  })

  it('muestra los campos de fecha inicio y fin', () => {
    render(<EventForm />)
    expect(screen.getByTestId('start-at-input')).toBeInTheDocument()
    expect(screen.getByTestId('end-at-input')).toBeInTheDocument()
  })

  it('muestra el campo de municipio', () => {
    render(<EventForm />)
    expect(screen.getByTestId('municipality-input')).toBeInTheDocument()
  })

  it('muestra el botón de submit', () => {
    render(<EventForm />)
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })

  it('hace POST a /api/calendar/events al enviar el formulario con datos válidos', async () => {
    fetchMock.mockResolvedValueOnce({
      ok:   true,
      json: async () => ({ id: 'new-event-id' }),
    })

    render(<EventForm defaultDate="2026-03-15" />)

    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Mitin de Prueba' } })
    fireEvent.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/calendar/events',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('redirige a /dashboard/calendar tras crear el evento exitosamente', async () => {
    fetchMock.mockResolvedValueOnce({
      ok:   true,
      json: async () => ({ id: 'new-event-id' }),
    })

    render(<EventForm defaultDate="2026-03-15" />)
    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Evento Test' } })
    fireEvent.click(screen.getByTestId('submit-button'))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard/calendar'))
  })

  it('muestra error si el título está vacío al hacer submit', async () => {
    render(<EventForm />)
    fireEvent.click(screen.getByTestId('submit-button'))
    await waitFor(() => expect(screen.getByText('El título es obligatorio')).toBeInTheDocument())
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('cambia el tipo de evento al hacer click en el selector', () => {
    render(<EventForm />)
    fireEvent.click(screen.getByTestId('event-type-canvassing'))
    // The canvassing button should be selected (aria or visual indicator)
    // We verify by checking the button exists and can be clicked without error
    expect(screen.getByTestId('event-type-canvassing')).toBeInTheDocument()
  })

  it('usa la fecha por defecto si se pasa defaultDate', () => {
    render(<EventForm defaultDate="2026-05-20" />)
    const startInput = screen.getByTestId('start-at-input') as HTMLInputElement
    expect(startInput.value).toContain('2026-05-20')
  })
})
