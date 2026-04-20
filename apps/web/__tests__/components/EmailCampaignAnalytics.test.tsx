import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tremor/react', () => ({
  BarChart: (props: any) => <div data-testid="bar-chart">{JSON.stringify(props.data)}</div>,
}))

import { EmailCampaignAnalytics } from '@/components/dashboard/EmailCampaignAnalytics'

describe('EmailCampaignAnalytics', () => {
  it('renders KPI cards with correct values', () => {
    render(
      <EmailCampaignAnalytics
        recipientCount={100}
        deliveredCount={95}
        openedCount={60}
        clickedCount={20}
        bouncedCount={5}
      />
    )
    expect(screen.getByText('95')).toBeDefined()
    expect(screen.getByText('60')).toBeDefined()
    expect(screen.getByText('20')).toBeDefined()
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('Entregados')).toBeDefined()
    expect(screen.getByText('Abiertos')).toBeDefined()
    expect(screen.getByText('Clics')).toBeDefined()
    expect(screen.getByText('Rebotes')).toBeDefined()
  })

  it('shows engagement funnel chart when data exists', () => {
    render(
      <EmailCampaignAnalytics
        recipientCount={100}
        deliveredCount={95}
        openedCount={60}
        clickedCount={20}
        bouncedCount={5}
      />
    )
    expect(screen.getByText('Embudo de engagement')).toBeDefined()
    expect(screen.getByTestId('bar-chart')).toBeDefined()
  })

  it('shows placeholder when no tracking data', () => {
    render(
      <EmailCampaignAnalytics
        recipientCount={100}
        deliveredCount={0}
        openedCount={0}
        clickedCount={0}
        bouncedCount={0}
      />
    )
    expect(screen.getByText(/métricas se actualizarán/i)).toBeDefined()
    expect(screen.queryByTestId('bar-chart')).toBeNull()
  })

  it('calculates percentages correctly', () => {
    render(
      <EmailCampaignAnalytics
        recipientCount={200}
        deliveredCount={190}
        openedCount={95}
        clickedCount={19}
        bouncedCount={10}
      />
    )
    // Opened: 95/190 = 50%
    expect(screen.getByText('50%')).toBeDefined()
    // Bounced: 10/200 = 5%
    expect(screen.getByText('5%')).toBeDefined()
  })
})
