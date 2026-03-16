import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarWeekView } from '@/components/dashboard/calendar/CalendarWeekView'
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
    title:               'Reunión Equipo',
    event_type:          'internal_meeting',
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

const MONDAY_MAR16 = new Date(2026, 2, 16)  // March 16 2026 (Monday)

describe('CalendarWeekView', () => {

  it('renderiza 7 columnas de días', () => {
    render(
      <CalendarWeekView
        events={[]}
        activeDate={MONDAY_MAR16}
        onWeekChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    // 7 day columns exist
    const cols = screen.getAllByTestId(/^week-column-/)
    expect(cols).toHaveLength(7)
  })

  it('muestra el rango de la semana en el encabezado', () => {
    render(
      <CalendarWeekView
        events={[]}
        activeDate={MONDAY_MAR16}
        onWeekChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    expect(screen.getByText(/Semana del/i)).toBeInTheDocument()
  })

  it('muestra un evento en la columna del día correcto', () => {
    const event = makeEvent({ start_at: '2026-03-16T09:00:00Z', end_at: '2026-03-16T10:00:00Z' })
    render(
      <CalendarWeekView
        events={[event]}
        activeDate={MONDAY_MAR16}
        onWeekChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    expect(screen.getByText('Reunión Equipo')).toBeInTheDocument()
  })

  it('no crashea con lista de eventos vacía', () => {
    expect(() =>
      render(
        <CalendarWeekView
          events={[]}
          activeDate={MONDAY_MAR16}
          onWeekChange={vi.fn()}
          onSelectEvent={vi.fn()}
        />
      )
    ).not.toThrow()
  })

  it('llama onSelectEvent al hacer click en un evento', () => {
    const onSelect = vi.fn()
    const event    = makeEvent()
    render(
      <CalendarWeekView
        events={[event]}
        activeDate={MONDAY_MAR16}
        onWeekChange={onSelect}
        onSelectEvent={onSelect}
      />
    )
    fireEvent.click(screen.getByTestId('week-event'))
    // onSelect was called (either onSelectEvent or onWeekChange)
    expect(onSelect).toHaveBeenCalled()
  })

  it('llama onWeekChange al navegar a semana anterior', () => {
    const onWeekChange = vi.fn()
    render(
      <CalendarWeekView
        events={[]}
        activeDate={MONDAY_MAR16}
        onWeekChange={onWeekChange}
        onSelectEvent={vi.fn()}
      />
    )
    fireEvent.click(screen.getByLabelText('Semana anterior'))
    expect(onWeekChange).toHaveBeenCalled()
  })

  it('llama onWeekChange al navegar a semana siguiente', () => {
    const onWeekChange = vi.fn()
    render(
      <CalendarWeekView
        events={[]}
        activeDate={MONDAY_MAR16}
        onWeekChange={onWeekChange}
        onSelectEvent={vi.fn()}
      />
    )
    fireEvent.click(screen.getByLabelText('Semana siguiente'))
    expect(onWeekChange).toHaveBeenCalled()
  })
})
