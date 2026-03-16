import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VolunteerLeaderboard } from '@/components/dashboard/VolunteerLeaderboard'
import { getLevel } from '@/lib/gamification'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const makeEntry = (overrides: Partial<Parameters<typeof VolunteerLeaderboard>[0]['entries'][0]> = {}) => ({
  id: 'u1',
  name: 'Ana García',
  points: 120,
  level: getLevel(120),
  visitas: 18,
  rank: 1,
  ...overrides,
})

describe('VolunteerLeaderboard', () => {
  it('shows empty state when no entries', () => {
    render(<VolunteerLeaderboard entries={[]} />)
    expect(screen.getByText(/no hay datos de visitas/i)).toBeInTheDocument()
  })

  it('renders volunteer name', () => {
    render(<VolunteerLeaderboard entries={[makeEntry()]} />)
    expect(screen.getByText('Ana García')).toBeInTheDocument()
  })

  it('renders points', () => {
    render(<VolunteerLeaderboard entries={[makeEntry({ points: 120 })]} />)
    expect(screen.getByText('120 pts')).toBeInTheDocument()
  })

  it('renders visit count', () => {
    render(<VolunteerLeaderboard entries={[makeEntry({ visitas: 18 })]} />)
    expect(screen.getByText('18 visitas')).toBeInTheDocument()
  })

  it('renders level name', () => {
    render(<VolunteerLeaderboard entries={[makeEntry({ points: 120 })]} />)
    expect(screen.getByText(/activista/i)).toBeInTheDocument()
  })

  it('renders gold medal for rank 1', () => {
    render(<VolunteerLeaderboard entries={[makeEntry({ rank: 1 })]} />)
    expect(screen.getByText('🥇')).toBeInTheDocument()
  })

  it('renders silver medal for rank 2', () => {
    render(<VolunteerLeaderboard entries={[makeEntry({ rank: 2, id: 'u2' })]} />)
    expect(screen.getByText('🥈')).toBeInTheDocument()
  })

  it('renders #4 for rank 4', () => {
    render(<VolunteerLeaderboard entries={[makeEntry({ rank: 4, id: 'u4' })]} />)
    expect(screen.getByText('#4')).toBeInTheDocument()
  })

  it('links to volunteer profile page', () => {
    render(<VolunteerLeaderboard entries={[makeEntry({ id: 'abc123' })]} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard/team/abc123')
  })

  it('renders multiple entries', () => {
    const entries = [
      makeEntry({ id: 'u1', name: 'Ana', rank: 1, points: 300 }),
      makeEntry({ id: 'u2', name: 'Luis', rank: 2, points: 200 }),
      makeEntry({ id: 'u3', name: 'Marta', rank: 3, points: 100 }),
    ]
    render(<VolunteerLeaderboard entries={entries} />)
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Luis')).toBeInTheDocument()
    expect(screen.getByText('Marta')).toBeInTheDocument()
  })
})
