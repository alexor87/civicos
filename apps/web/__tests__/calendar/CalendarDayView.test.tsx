import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarDayView } from '@/components/dashboard/calendar/CalendarDayView'
import type { CalendarEvent } from '@/components/dashboard/calendar/eventTypes'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// jsdom doesn't implement scrollTo — mock it globally
beforeEach(() => {
  Element.prototype.scrollTo = vi.fn()
})

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id:                  'evt-1',
    title:               'Reunión Barrio',
    event_type:          'canvassing',
    status:              'confirmed',
    all_day:             false,
    start_at:            '2026-03-16T09:00:00Z',
    end_at:              '2026-03-16T10:00:00Z',
    location_text:       null,
    municipality_name:   null,
    municipality_code:   null,
    neighborhood_name:   null,
    description:         null,
    internal_notes:      null,
    expected_attendance: null,
    actual_attendance:   null,
    post_event_notes:    null,
    post_event_rating:   null,
    completed_at:        null,
    intelligence_status: 'pending',
    ai_briefing:         null,
    campaign_id:         'camp-1',
    created_at:          '2026-03-01T00:00:00Z',
    ...overrides,
  }
}

const MONDAY_MAR16 = new Date(2026, 2, 16)  // March 16 2026

describe('CalendarDayView', () => {

  it('renderiza la columna del día con testid', () => {
    render(
      <CalendarDayView
        events={[]}
        activeDate={MONDAY_MAR16}
        onDayChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    expect(screen.getByTestId('day-column')).toBeInTheDocument()
  })

  it('muestra el nombre del día activo en el encabezado', () => {
    render(
      <CalendarDayView
        events={[]}
        activeDate={MONDAY_MAR16}
        onDayChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    // The day label shows weekday name — lunes = monday in spanish
    expect(screen.getByText(/lunes/i)).toBeInTheDocument()
  })

  it('muestra un evento del día con su título', () => {
    const event = makeEvent({ start_at: '2026-03-16T09:00:00Z', end_at: '2026-03-16T10:00:00Z' })
    render(
      <CalendarDayView
        events={[event]}
        activeDate={MONDAY_MAR16}
        onDayChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    expect(screen.getByText('Reunión Barrio')).toBeInTheDocument()
    expect(screen.getByTestId('day-event')).toBeInTheDocument()
  })

  it('no crashea con lista de eventos vacía', () => {
    expect(() =>
      render(
        <CalendarDayView
          events={[]}
          activeDate={MONDAY_MAR16}
          onDayChange={vi.fn()}
          onSelectEvent={vi.fn()}
        />
      )
    ).not.toThrow()
  })

  it('muestra mensaje de sin eventos cuando no hay eventos', () => {
    render(
      <CalendarDayView
        events={[]}
        activeDate={MONDAY_MAR16}
        onDayChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    expect(screen.getByText(/sin eventos este día/i)).toBeInTheDocument()
  })

  it('llama onSelectEvent al hacer click en un evento', () => {
    const onSelect = vi.fn()
    const event    = makeEvent()
    render(
      <CalendarDayView
        events={[event]}
        activeDate={MONDAY_MAR16}
        onDayChange={vi.fn()}
        onSelectEvent={onSelect}
      />
    )
    fireEvent.click(screen.getByTestId('day-event'))
    expect(onSelect).toHaveBeenCalledWith(event)
  })

  it('llama onDayChange al navegar al día anterior', () => {
    const onDayChange = vi.fn()
    render(
      <CalendarDayView
        events={[]}
        activeDate={MONDAY_MAR16}
        onDayChange={onDayChange}
        onSelectEvent={vi.fn()}
      />
    )
    fireEvent.click(screen.getByLabelText('Día anterior'))
    expect(onDayChange).toHaveBeenCalled()
  })

  it('llama onDayChange al navegar al día siguiente', () => {
    const onDayChange = vi.fn()
    render(
      <CalendarDayView
        events={[]}
        activeDate={MONDAY_MAR16}
        onDayChange={onDayChange}
        onSelectEvent={vi.fn()}
      />
    )
    fireEvent.click(screen.getByLabelText('Día siguiente'))
    expect(onDayChange).toHaveBeenCalled()
  })

  it('no muestra eventos de otros días', () => {
    // Event is on March 17, but activeDate is March 16
    const event = makeEvent({ start_at: '2026-03-17T09:00:00Z', end_at: '2026-03-17T10:00:00Z' })
    render(
      <CalendarDayView
        events={[event]}
        activeDate={MONDAY_MAR16}
        onDayChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    expect(screen.queryByTestId('day-event')).not.toBeInTheDocument()
  })
})
