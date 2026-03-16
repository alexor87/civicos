import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { WarRoom } from '@/components/dashboard/calendar/WarRoom'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const mockWarRoomData = {
  upcoming: [
    {
      id:                 'evt-1',
      title:              'Mitin Plaza Central',
      event_type:         'public_event',
      status:             'confirmed',
      start_at:           new Date(Date.now() + 86400000).toISOString(),  // tomorrow
      location_text:      'Plaza Central',
      municipality_name:  'Rionegro',
      intelligence_status: 'ready',
      all_day:            false,
    },
  ],
  intelligenceAlerts: [
    {
      id:                 'evt-2',
      title:              'Canvassing Sin Briefing',
      event_type:         'canvassing',
      status:             'confirmed',
      start_at:           new Date(Date.now() + 172800000).toISOString(), // 2 days
      location_text:      null,
      municipality_name:  null,
      intelligence_status: 'pending',
      all_day:            false,
    },
  ],
  field: {
    totalContacts:   1234,
    sympathizersPct: 42,
    undecidedPct:    28,
    recentVisits:    87,
  },
  monthStats: {
    total:        15,
    completed:    6,
    pending:      7,
    cancelled:    2,
    completedPct: 40,
    nextElection: null,
  },
}

describe('WarRoom', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWarRoomData,
    }))
  })

  it('renderiza el contenedor warroom con testid', async () => {
    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByTestId('warroom')).toBeInTheDocument()
    })
  })

  it('muestra el cuadrante "Próximos 7 días"', async () => {
    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByText('Próximos 7 días')).toBeInTheDocument()
    })
  })

  it('muestra el cuadrante "Alertas de Inteligencia"', async () => {
    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByText('Alertas de Inteligencia')).toBeInTheDocument()
    })
  })

  it('muestra el cuadrante "Resumen de Campo"', async () => {
    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByText('Resumen de Campo')).toBeInTheDocument()
    })
  })

  it('muestra el cuadrante "Estado del Calendario"', async () => {
    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByText('Estado del Calendario')).toBeInTheDocument()
    })
  })

  it('muestra la lista de próximos eventos', async () => {
    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByTestId('upcoming-events')).toBeInTheDocument()
      expect(screen.getByText('Mitin Plaza Central')).toBeInTheDocument()
    })
  })

  it('muestra las alertas de inteligencia', async () => {
    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByTestId('intelligence-alerts')).toBeInTheDocument()
      expect(screen.getByText('Canvassing Sin Briefing')).toBeInTheDocument()
    })
  })

  it('muestra los datos de campo', async () => {
    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByText('1.234')).toBeInTheDocument()  // totalContacts
      expect(screen.getByText('42%')).toBeInTheDocument()    // sympathizersPct
    })
  })

  it('muestra estadísticas del mes', async () => {
    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByText('40%')).toBeInTheDocument()  // completedPct
    })
  })

  it('no crashea si no hay eventos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockWarRoomData,
        upcoming: [],
        intelligenceAlerts: [],
      }),
    }))

    expect(() => render(<WarRoom />)).not.toThrow()
    await waitFor(() => {
      expect(screen.getByTestId('warroom')).toBeInTheDocument()
    })
  })

  it('muestra mensaje vacío si no hay eventos próximos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockWarRoomData,
        upcoming: [],
        intelligenceAlerts: [],
      }),
    }))

    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByText(/sin eventos en los próximos 7 días/i)).toBeInTheDocument()
    })
  })

  it('llama al endpoint de inteligencia al hacer click en Generar', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockWarRoomData })  // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })              // generate briefing
      .mockResolvedValueOnce({ ok: true, json: async () => mockWarRoomData })  // reload

    vi.stubGlobal('fetch', mockFetch)

    render(<WarRoom />)
    await waitFor(() => {
      expect(screen.getByText('Generar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Generar'))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/intelligence'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})
