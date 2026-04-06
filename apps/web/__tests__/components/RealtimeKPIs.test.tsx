import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { RealtimeKPIs } from '@/components/dashboard/RealtimeKPIs'

// Mock DashboardKPIs as a simple div with data attributes
vi.mock('@/components/dashboard/DashboardKPIs', () => ({
  DashboardKPIs: (props: Record<string, unknown>) => (
    <div
      data-testid="kpis"
      data-total={String(props.totalContacts)}
      data-supporters={String(props.supporters)}
      data-pending={String(props.pendingVisits)}
      data-visits={String(props.totalVisits)}
    />
  ),
}))

// Mock fetch
global.fetch = vi.fn()

// Mock Supabase channel
const mockChannel = {
  on: vi.fn(),
  subscribe: vi.fn(),
}
mockChannel.on.mockReturnValue(mockChannel)
mockChannel.subscribe.mockReturnValue(mockChannel)

const mockSupabase = {
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn(),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

const initialKPIs = {
  totalContacts: 100,
  supporters: 40,
  pendingVisits: 5,
  totalVisits: 80,
  supportRate: 40,
  coverageRate: 80,
  weeklyData: [],
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.resetAllMocks()
  mockSupabase.channel.mockReturnValue(mockChannel)
  mockChannel.on.mockReturnValue(mockChannel)
  mockChannel.subscribe.mockReturnValue(mockChannel)
  ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      totalContacts: 101,
      supporters: 41,
      pendingVisits: 4,
      totalVisits: 81,
      supportRate: 41,
      coverageRate: 80,
    }),
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('RealtimeKPIs', () => {
  it('renders initial KPIs immediately', () => {
    render(<RealtimeKPIs campaignId="c1" initialKPIs={initialKPIs} />)
    const el = screen.getByTestId('kpis')
    expect(el.dataset.total).toBe('100')
    expect(el.dataset.supporters).toBe('40')
    expect(el.dataset.pending).toBe('5')
  })

  it('subscribes to a Supabase channel on mount', () => {
    render(<RealtimeKPIs campaignId="c1" initialKPIs={initialKPIs} />)
    expect(mockSupabase.channel).toHaveBeenCalledWith('dashboard-kpis-c1')
    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('registers listeners for both contacts and canvass_visits', () => {
    render(<RealtimeKPIs campaignId="c1" initialKPIs={initialKPIs} />)
    const tables = mockChannel.on.mock.calls.map((call: unknown[]) => {
      const filter = call[1] as { table: string }
      return filter?.table
    })
    expect(tables).toContain('contacts')
    expect(tables).toContain('canvass_visits')
  })

  it('debounces and fetches fresh KPIs after 5 seconds', async () => {
    render(<RealtimeKPIs campaignId="c1" initialKPIs={initialKPIs} />)

    const callback = mockChannel.on.mock.calls[0][2] as () => void

    // Fire the realtime event
    act(() => { callback() })

    // Fetch should NOT have been called yet (debounce pending)
    expect(fetch).not.toHaveBeenCalled()

    // Advance past the 5-second debounce and flush microtasks
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100)
    })

    expect(fetch).toHaveBeenCalledWith('/api/dashboard/kpis?campaignId=c1')
    expect(screen.getByTestId('kpis').dataset.total).toBe('101')
  }, 15000)

  it('collapses multiple rapid events into a single fetch', async () => {
    render(<RealtimeKPIs campaignId="c1" initialKPIs={initialKPIs} />)

    const callback = mockChannel.on.mock.calls[0][2] as () => void

    // Fire 5 rapid events
    act(() => {
      callback()
      callback()
      callback()
      callback()
      callback()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100)
    })

    // Should only have fetched once despite 5 events
    expect(fetch).toHaveBeenCalledTimes(1)
  }, 15000)

  it('does not update state if fetch fails', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false })
    render(<RealtimeKPIs campaignId="c1" initialKPIs={initialKPIs} />)

    const callback = mockChannel.on.mock.calls[0][2] as () => void
    act(() => { callback() })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100)
    })

    expect(screen.getByTestId('kpis').dataset.total).toBe('100')
  }, 15000)

  it('silently handles fetch exceptions without crashing', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network error'))
    render(<RealtimeKPIs campaignId="c1" initialKPIs={initialKPIs} />)

    const callback = mockChannel.on.mock.calls[0][2] as () => void
    act(() => { callback() })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100)
    })

    expect(screen.getByTestId('kpis').dataset.total).toBe('100')
  }, 15000)

  it('removes channel on unmount', () => {
    const { unmount } = render(<RealtimeKPIs campaignId="c1" initialKPIs={initialKPIs} />)
    unmount()
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })
})
