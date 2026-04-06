import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { act } from 'react'
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

  it('navigates to full form when opened', async () => {
    await act(async () => {
      render(<ContactEntryModal {...defaultProps} />)
    })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/contacts/new')
  })

  it('calls onOpenChange(false) when opened', async () => {
    const onOpenChange = vi.fn()
    await act(async () => {
      render(<ContactEntryModal {...defaultProps} onOpenChange={onOpenChange} />)
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not navigate when closed', async () => {
    mockPush.mockClear()
    await act(async () => {
      render(<ContactEntryModal {...defaultProps} open={false} />)
    })
    expect(mockPush).not.toHaveBeenCalled()
  })
})
