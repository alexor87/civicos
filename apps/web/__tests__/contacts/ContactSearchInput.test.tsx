import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContactSearchInput } from '@/components/contacts/selectors/ContactSearchInput'

describe('ContactSearchInput', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with placeholder', () => {
    render(<ContactSearchInput value="" onChange={() => {}} campaignId="camp-1" />)
    expect(screen.getByPlaceholderText('Buscar contacto...')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(<ContactSearchInput value="" onChange={() => {}} campaignId="camp-1" placeholder="Buscar líder..." />)
    expect(screen.getByPlaceholderText('Buscar líder...')).toBeInTheDocument()
  })

  it('calls onChange when typing', () => {
    const onChange = vi.fn()
    render(<ContactSearchInput value="" onChange={onChange} campaignId="camp-1" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ana' } })
    expect(onChange).toHaveBeenCalledWith('Ana')
  })

  it('fetches results after debounce', async () => {
    const mockResults = [
      { id: '1', first_name: 'Ana', last_name: 'Gómez', phone: '3001234567' },
    ]
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({ results: mockResults }),
    } as Response)

    render(<ContactSearchInput value="" onChange={() => {}} campaignId="camp-1" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ana' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/contacts/search?q=Ana')
      )
    }, { timeout: 1000 })
  })

  it('shows results dropdown', async () => {
    const mockResults = [
      { id: '1', first_name: 'Ana', last_name: 'Gómez', phone: '3001234567' },
    ]
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({ results: mockResults }),
    } as Response)

    render(<ContactSearchInput value="" onChange={() => {}} campaignId="camp-1" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ana' } })

    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument()
    expect(screen.getByText('3001234567')).toBeInTheDocument()
  })

  it('selects contact and calls onChange', async () => {
    const onChange = vi.fn()
    const mockResults = [
      { id: '1', first_name: 'Ana', last_name: 'Gómez', phone: null },
    ]
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({ results: mockResults }),
    } as Response)

    render(<ContactSearchInput value="" onChange={onChange} campaignId="camp-1" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ana' } })

    const resultBtn = await screen.findByText('Ana Gómez')
    fireEvent.click(resultBtn)

    expect(onChange).toHaveBeenCalledWith('Ana Gómez')
  })
})
