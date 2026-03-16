import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarMonthView } from '@/components/dashboard/calendar/CalendarMonthView'
import type { CalendarEvent } from '@/components/dashboard/calendar/eventTypes'

// ── Mock next/navigation ───────────────────────────────────────────────────────
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id:                  'evt-1',
    title:               'Mitin Plaza Central',
    event_type:          'public_event',
    status:              'confirmed',
    all_day:             false,
    start_at:            '2026-03-15T09:00:00Z',
    end_at:              '2026-03-15T12:00:00Z',
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

const MARCH_2026 = new Date(2026, 2, 1)  // March 1 2026

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CalendarMonthView', () => {

  it('muestra el nombre del mes y año actuales', () => {
    render(
      <CalendarMonthView
        events={[]}
        activeDate={MARCH_2026}
        onMonthChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    expect(screen.getByText(/Marzo 2026/i)).toBeInTheDocument()
  })

  it('muestra los encabezados de días de la semana', () => {
    render(
      <CalendarMonthView
        events={[]}
        activeDate={MARCH_2026}
        onMonthChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Dom')).toBeInTheDocument()
  })

  it('muestra el título del evento en el día correcto', () => {
    const event = makeEvent({ start_at: '2026-03-15T09:00:00Z' })
    render(
      <CalendarMonthView
        events={[event]}
        activeDate={MARCH_2026}
        onMonthChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    expect(screen.getByText('Mitin Plaza Central')).toBeInTheDocument()
  })

  it('no crashea con un mes sin eventos', () => {
    expect(() =>
      render(
        <CalendarMonthView
          events={[]}
          activeDate={MARCH_2026}
          onMonthChange={vi.fn()}
          onSelectEvent={vi.fn()}
        />
      )
    ).not.toThrow()
  })

  it('llama onSelectEvent al hacer click en un evento', () => {
    const onSelect = vi.fn()
    const event    = makeEvent({ start_at: '2026-03-15T09:00:00Z' })
    render(
      <CalendarMonthView
        events={[event]}
        activeDate={MARCH_2026}
        onMonthChange={vi.fn()}
        onSelectEvent={onSelect}
      />
    )
    fireEvent.click(screen.getByText('Mitin Plaza Central'))
    expect(onSelect).toHaveBeenCalledWith(event)
  })

  it('llama onMonthChange al hacer click en mes anterior', () => {
    const onMonthChange = vi.fn()
    render(
      <CalendarMonthView
        events={[]}
        activeDate={MARCH_2026}
        onMonthChange={onMonthChange}
        onSelectEvent={vi.fn()}
      />
    )
    fireEvent.click(screen.getByLabelText('Mes anterior'))
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 1, 1))
  })

  it('muestra chip +N más cuando hay más de 3 eventos en un día', () => {
    const events = [1,2,3,4].map(i =>
      makeEvent({ id: `evt-${i}`, title: `Evento ${i}`, start_at: '2026-03-15T09:00:00Z' })
    )
    render(
      <CalendarMonthView
        events={events}
        activeDate={MARCH_2026}
        onMonthChange={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    )
    expect(screen.getByText('+1 más')).toBeInTheDocument()
  })
})
