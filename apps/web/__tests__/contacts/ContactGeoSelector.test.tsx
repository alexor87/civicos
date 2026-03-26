import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ContactGeoSelector } from '@/components/contacts/ContactGeoSelector'

const mockGeoData = {
  metadata: {},
  ciudades: [
    {
      municipio_codigo: '05001',
      municipio_nombre: 'Medellín',
      departamento_codigo: '05',
      tipo_division_urbana: 'comuna',
      comunas: [
        { codigo: '01', nombre: 'Popular', barrios: ['Santo Domingo', 'Popular'] },
        { codigo: '16', nombre: 'Belén', barrios: ['Belén', 'La Palma'] },
      ],
    },
    {
      municipio_codigo: '11001',
      municipio_nombre: 'Bogotá D.C.',
      departamento_codigo: '11',
      tipo_division_urbana: 'localidad',
      localidades: [
        { codigo: '01', nombre: 'Usaquén', upz: [{ codigo: '09', nombre: 'Verbenal', barrios: ['Verbenal', 'La Uribe'] }] },
      ],
    },
  ],
}

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockGeoData),
  })
})

describe('ContactGeoSelector', () => {
  it('renders GeoSelector with department dropdown', async () => {
    render(<ContactGeoSelector />)
    await waitFor(() => {
      expect(screen.getByText('Departamento')).toBeInTheDocument()
    })
    expect(screen.getByText('Municipio')).toBeInTheDocument()
  })

  it('renders hidden inputs for form submission', async () => {
    const { container } = render(<ContactGeoSelector />)
    await waitFor(() => {
      expect(screen.getByText('Departamento')).toBeInTheDocument()
    })
    const hiddenInputs = container.querySelectorAll('input[type="hidden"]')
    const names = Array.from(hiddenInputs).map(i => i.getAttribute('name'))
    expect(names).toContain('department')
    expect(names).toContain('municipality')
    expect(names).toContain('commune')
    expect(names).toContain('district_barrio')
  })

  it('hidden inputs start empty when no defaults', async () => {
    const { container } = render(<ContactGeoSelector />)
    await waitFor(() => {
      expect(screen.getByText('Departamento')).toBeInTheDocument()
    })
    const deptInput = container.querySelector('input[name="department"]') as HTMLInputElement
    expect(deptInput.value).toBe('')
  })

  it('shows loading skeleton before geo data loads', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // never resolves
    const { container } = render(<ContactGeoSelector defaultDepartment="Antioquia" />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('resolves defaults when editing existing contact', async () => {
    const { container } = render(
      <ContactGeoSelector
        defaultDepartment="Antioquia"
        defaultMunicipality="Medellín"
        defaultCommune="Belén"
        defaultBarrio="La Palma"
      />
    )
    await waitFor(() => {
      expect(screen.getByText('Departamento')).toBeInTheDocument()
    })

    // Hidden inputs should have the default values
    const deptInput = container.querySelector('input[name="department"]') as HTMLInputElement
    expect(deptInput.value).toBe('Antioquia')
    const muniInput = container.querySelector('input[name="municipality"]') as HTMLInputElement
    expect(muniInput.value).toBe('Medellín')
    const communeInput = container.querySelector('input[name="commune"]') as HTMLInputElement
    expect(communeInput.value).toBe('Belén')
    const barrioInput = container.querySelector('input[name="district_barrio"]') as HTMLInputElement
    expect(barrioInput.value).toBe('La Palma')
  })
})
