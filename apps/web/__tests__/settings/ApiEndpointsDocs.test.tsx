import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ApiEndpointsDocs } from '@/components/settings/ApiEndpointsDocs'

describe('ApiEndpointsDocs', () => {
  it('renderiza los 3 endpoints', () => {
    render(<ApiEndpointsDocs />)
    expect(screen.getAllByText('/api/public/contacts').length).toBe(2) // GET + POST
    expect(screen.getByText('/api/public/campaigns/:id')).toBeInTheDocument()
  })

  it('los endpoints están colapsados por defecto', () => {
    render(<ApiEndpointsDocs />)
    expect(screen.queryByText('Request body')).not.toBeInTheDocument()
    expect(screen.queryByText('Response')).not.toBeInTheDocument()
  })

  it('expande un endpoint al hacer click y muestra response', () => {
    render(<ApiEndpointsDocs />)
    // Click GET /api/public/contacts
    fireEvent.click(screen.getByLabelText('GET /api/public/contacts'))
    expect(screen.getByText('Response')).toBeInTheDocument()
  })

  it('el endpoint POST muestra request body y response', () => {
    render(<ApiEndpointsDocs />)
    fireEvent.click(screen.getByLabelText('POST /api/public/contacts'))
    expect(screen.getByText('Request body')).toBeInTheDocument()
    expect(screen.getByText('Response')).toBeInTheDocument()
  })

  it('colapsa al hacer click de nuevo', () => {
    render(<ApiEndpointsDocs />)
    const btn = screen.getByLabelText('GET /api/public/contacts')
    fireEvent.click(btn) // expand
    expect(screen.getByText('Response')).toBeInTheDocument()
    fireEvent.click(btn) // collapse
    expect(screen.queryByText('Response')).not.toBeInTheDocument()
  })
})
