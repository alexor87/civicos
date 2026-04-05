import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CoachMark } from '@/components/onboarding/CoachMark'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})

describe('CoachMark', () => {
  it('shows after delay when not previously seen', async () => {
    render(
      <CoachMark
        storageKey="test_mark"
        title="Test Title"
        description="Test description"
      />
    )

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    }, { timeout: 2000 })

    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('does not show if already seen', async () => {
    localStorageMock.setItem('coach_mark_test_mark_seen', '1')

    render(
      <CoachMark
        storageKey="test_mark"
        title="Test Title"
        description="Test description"
      />
    )

    await new Promise(r => setTimeout(r, 1000))
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
  })

  it('marks as seen and hides when clicking Entendido', async () => {
    render(
      <CoachMark
        storageKey="dismiss_test"
        title="Dismissable"
        description="Click to dismiss"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entendido/i })).toBeInTheDocument()
    }, { timeout: 2000 })

    await userEvent.click(screen.getByRole('button', { name: /entendido/i }))

    expect(localStorageMock.setItem).toHaveBeenCalledWith('coach_mark_dismiss_test_seen', '1')
  })

  it('shows the Entendido button', async () => {
    render(
      <CoachMark
        storageKey="btn_test"
        title="Button Test"
        description="Has button"
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entendido/i })).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
