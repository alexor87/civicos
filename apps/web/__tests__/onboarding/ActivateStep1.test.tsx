import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivateStep1 } from '@/components/onboarding/ActivateStep1'

describe('ActivateStep1', () => {
  const defaultData = { electionType: '', candidateName: '' }

  it('renders election type options', () => {
    render(<ActivateStep1 data={defaultData} onChange={vi.fn()} />)
    expect(screen.getByText('Alcalde Municipal')).toBeInTheDocument()
    expect(screen.getByText('Concejal Municipal')).toBeInTheDocument()
    expect(screen.getByText('Gobernador Departamental')).toBeInTheDocument()
  })

  it('renders candidate name input', () => {
    render(<ActivateStep1 data={defaultData} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/nombre del candidato/i)).toBeInTheDocument()
  })

  it('calls onChange when election type is selected', async () => {
    const onChange = vi.fn()
    render(<ActivateStep1 data={defaultData} onChange={onChange} />)
    await userEvent.click(screen.getByText('Alcalde Municipal'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ electionType: 'alcalde' })
    )
  })

  it('calls onChange when candidate name is typed', async () => {
    const onChange = vi.fn()
    render(<ActivateStep1 data={defaultData} onChange={onChange} />)
    await userEvent.type(screen.getByLabelText(/nombre del candidato/i), 'A')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ candidateName: 'A' })
    )
  })

  it('highlights the selected election type', () => {
    const data = { electionType: 'alcalde', candidateName: '' }
    render(<ActivateStep1 data={data} onChange={vi.fn()} />)
    const btn = screen.getByText('Alcalde Municipal').closest('button')
    expect(btn?.className).toContain('border-blue-600')
  })
})
