import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { StepAdditional } from '@/components/contacts/steps/StepAdditional'
import type { ContactForm } from '@/lib/schemas/contact-form'

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<ContactForm>({
    defaultValues: {
      first_name: '', last_name: '', document_type: 'CC',
      document_number: '', phone: '', status: 'unknown',
    },
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('StepAdditional', () => {
  it('renders birth date field', () => {
    render(<StepAdditional />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/fecha de nacimiento/i)).toBeInTheDocument()
  })

  it('renders gender select', () => {
    render(<StepAdditional />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/género/i)).toBeInTheDocument()
  })

  it('renders marital status select', () => {
    render(<StepAdditional />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/estado civil/i)).toBeInTheDocument()
  })

  it('renders source fields', () => {
    render(<StepAdditional />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/fuente de captura/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/detalle de fuente/i)).toBeInTheDocument()
  })

  it('renders strategic fields', () => {
    render(<StepAdditional />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/líder que refiere/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/votos que moviliza/i)).toBeInTheDocument()
  })

  it('renders need and sector fields', () => {
    render(<StepAdditional />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/necesidad principal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sector económico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/beneficiario de programa/i)).toBeInTheDocument()
  })
})
