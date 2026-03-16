import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ElectoralTimeline } from '@/components/dashboard/calendar/ElectoralTimeline'
import { EVENT_TYPE_CONFIG } from '@/components/dashboard/calendar/eventTypes'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const mockEvent = {
  id:                  'evt-1',
  title:               'Gran Mitin Central',
  event_type:          'public_event',
  status:              'confirmed',
  all_day:             false,
  start_at:            new Date().toISOString(),  // today
  end_at:              new Date(Date.now() + 3600000).toISOString(),
  location_text:       'Plaza Principal',
  municipality_name:   'Rionegro',
  municipality_code:   null,
  neighborhood_name:   null,
  description:         null,
  internal_notes:      null,
  expected_attendance: 500,
  actual_attendance:   null,
  post_event_notes:    null,
  post_event_rating:   null,
  completed_at:        null,
  intelligence_status: 'pending',
  ai_briefing:         null,
  campaign_id:         'camp-1',
  created_at:          '2026-03-01T00:00:00Z',
}

describe('ElectoralTimeline', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockEvent],
    }))
  })

  it('renderiza el contenedor principal con testid', async () => {
    render(<ElectoralTimeline />)
    await waitFor(() => {
      expect(screen.getByTestId('electoral-timeline')).toBeInTheDocument()
    })
  })

  it('muestra el indicador de hoy', async () => {
    render(<ElectoralTimeline />)
    await waitFor(() => {
      // There is one today-marker per event-type row
      const markers = screen.getAllByTestId('today-marker')
      expect(markers.length).toBeGreaterThan(0)
    })
  })

  it('muestra los tipos de evento como filas (leyenda)', async () => {
    render(<ElectoralTimeline />)
    await waitFor(() => {
      // Check at least one event type label from config is rendered (may appear multiple times)
      const labels = Object.values(EVENT_TYPE_CONFIG).map(c => c.label)
      const anyVisible = labels.some(label => screen.queryAllByText(label).length > 0)
      expect(anyVisible).toBe(true)
    })
  })

  it('muestra un evento cuando el fetch devuelve datos', async () => {
    render(<ElectoralTimeline />)
    await waitFor(() => {
      expect(screen.getByTestId('timeline-event')).toBeInTheDocument()
    })
  })

  it('no crashea con lista de eventos vacía', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }))

    expect(() => render(<ElectoralTimeline />)).not.toThrow()
    await waitFor(() => {
      expect(screen.getByTestId('electoral-timeline')).toBeInTheDocument()
    })
  })

  it('no crashea si el fetch falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => [],
    }))

    expect(() => render(<ElectoralTimeline />)).not.toThrow()
    await waitFor(() => {
      expect(screen.getByTestId('electoral-timeline')).toBeInTheDocument()
    })
  })

  it('muestra el texto Hoy en el eje de fechas', async () => {
    render(<ElectoralTimeline />)
    await waitFor(() => {
      expect(screen.getByText('Hoy')).toBeInTheDocument()
    })
  })
})
