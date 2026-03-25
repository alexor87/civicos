import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }),
}))

const HEADER_PROPS = {
  campaignName: 'Elecciones 2026',
  userFullName: 'Juan Pérez',
  userInitials: 'JP',
  userRole: 'super_admin',
  campaigns: [{ id: '1', name: 'Camp 1' }],
  activeCampaignId: '1',
}

describe('DashboardHeader — User Dropdown', () => {
  it('renders user name and initials', () => {
    render(<DashboardHeader {...HEADER_PROPS} />)
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('JP')).toBeInTheDocument()
  })

  it('renders the user role label', () => {
    render(<DashboardHeader {...HEADER_PROPS} />)
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
  })

  it('renders campaign name in header', () => {
    render(<DashboardHeader {...HEADER_PROPS} />)
    expect(screen.getByText('Elecciones 2026')).toBeInTheDocument()
  })
})
