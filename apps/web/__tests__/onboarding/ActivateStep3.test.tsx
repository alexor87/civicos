import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivateStep3 } from '@/components/onboarding/ActivateStep3'

describe('ActivateStep3', () => {
  const defaultData = { plan: 'profesional' as const, electionDate: '' }

  it('renders both plan options', () => {
    render(<ActivateStep3 data={defaultData} onChange={vi.fn()} />)
    expect(screen.getByText('Esencial')).toBeInTheDocument()
    expect(screen.getByText('Profesional')).toBeInTheDocument()
  })

  it('shows Popular badge on professional plan', () => {
    render(<ActivateStep3 data={defaultData} onChange={vi.fn()} />)
    expect(screen.getByText('Popular')).toBeInTheDocument()
  })

  it('renders election date input', () => {
    render(<ActivateStep3 data={defaultData} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/fecha de elección/i)).toBeInTheDocument()
  })

  it('calls onChange when plan is selected', async () => {
    const onChange = vi.fn()
    render(<ActivateStep3 data={defaultData} onChange={onChange} />)
    await userEvent.click(screen.getByText('Esencial'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'esencial' })
    )
  })

  it('highlights selected plan', () => {
    render(<ActivateStep3 data={defaultData} onChange={vi.fn()} />)
    const proBtn = screen.getByText('Profesional').closest('button')
    expect(proBtn?.className).toContain('border-blue-600')
  })

  it('lists features for each plan', () => {
    render(<ActivateStep3 data={defaultData} onChange={vi.fn()} />)
    expect(screen.getByText(/contactos ilimitados/i)).toBeInTheDocument()
    expect(screen.getByText(/1,000 contactos/i)).toBeInTheDocument()
  })
})
