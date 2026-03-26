import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContactEntryModal } from '@/components/contacts/ContactEntryModal'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('ContactEntryModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    campaignId: 'camp-1',
  }

  it('renders two options when open', () => {
    render(<ContactEntryModal {...defaultProps} />)
    expect(screen.getByText('Captura rápida')).toBeInTheDocument()
    expect(screen.getByText('Ficha completa')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ContactEntryModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Captura rápida')).not.toBeInTheDocument()
  })

  it('navigates to full form when "Ficha completa" is clicked', () => {
    render(<ContactEntryModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Ficha completa'))
    expect(mockPush).toHaveBeenCalledWith('/dashboard/contacts/new')
  })

  it('opens QuickAddModal when "Captura rápida" is clicked', () => {
    render(<ContactEntryModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Captura rápida'))
    // After clicking, should show QuickAddModal content
    expect(screen.getByText(/nombre completo/i)).toBeInTheDocument()
  })
})
