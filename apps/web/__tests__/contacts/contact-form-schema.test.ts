import { describe, it, expect } from 'vitest'
import {
  quickAddSchema,
  contactFormSchema,
  stepEssentialsSchema,
  stepLocationSchema,
  stepPoliticalSchema,
  stepAdditionalSchema,
} from '@/lib/schemas/contact-form'

describe('quickAddSchema', () => {
  it('accepts valid quick-add data', () => {
    const result = quickAddSchema.safeParse({
      full_name: 'Juan Pérez',
      phone: '3001234567',
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional political_affinity', () => {
    const result = quickAddSchema.safeParse({
      full_name: 'Juan Pérez',
      phone: '3001234567',
      political_affinity: 3,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty full_name', () => {
    const result = quickAddSchema.safeParse({
      full_name: '',
      phone: '3001234567',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty phone', () => {
    const result = quickAddSchema.safeParse({
      full_name: 'Juan Pérez',
      phone: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects political_affinity outside 1-5 range', () => {
    const result = quickAddSchema.safeParse({
      full_name: 'Juan',
      phone: '300123',
      political_affinity: 6,
    })
    expect(result.success).toBe(false)
  })
})

describe('stepEssentialsSchema', () => {
  const validData = {
    first_name: 'Juan',
    last_name: 'Pérez',
    document_type: 'CC',
    document_number: '1234567890',
    phone: '3001234567',
    status: 'supporter',
    email: 'juan@test.com',
  }

  it('accepts valid essentials data', () => {
    const result = stepEssentialsSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects empty first_name', () => {
    const result = stepEssentialsSchema.safeParse({ ...validData, first_name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty last_name', () => {
    const result = stepEssentialsSchema.safeParse({ ...validData, last_name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid document_type', () => {
    const result = stepEssentialsSchema.safeParse({ ...validData, document_type: 'DNI' })
    expect(result.success).toBe(false)
  })

  it('accepts valid document types', () => {
    for (const dt of ['CC', 'CE', 'TI', 'Pasaporte']) {
      const result = stepEssentialsSchema.safeParse({ ...validData, document_type: dt })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    const result = stepEssentialsSchema.safeParse({ ...validData, status: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('accepts optional phone_alternate', () => {
    const result = stepEssentialsSchema.safeParse({
      ...validData,
      phone_alternate: '3009876543',
    })
    expect(result.success).toBe(true)
  })

  it('accepts missing email (optional field)', () => {
    const { email: _, ...withoutEmail } = validData
    const result = stepEssentialsSchema.safeParse(withoutEmail)
    expect(result.success).toBe(true)
  })

  it('rejects invalid email format', () => {
    const result = stepEssentialsSchema.safeParse({ ...validData, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})

describe('stepLocationSchema', () => {
  it('accepts empty location data (all optional)', () => {
    const result = stepLocationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts full location data', () => {
    const result = stepLocationSchema.safeParse({
      department: 'Antioquia',
      municipality: 'Medellín',
      commune: 'Belén',
      district_barrio: 'La Palma',
      address: 'Calle 10 #43-12',
      voting_place: 'IE San Juan',
      voting_table: '5',
    })
    expect(result.success).toBe(true)
  })
})

describe('stepPoliticalSchema', () => {
  it('accepts empty political data (all optional)', () => {
    const result = stepPoliticalSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts full political data', () => {
    const result = stepPoliticalSchema.safeParse({
      political_affinity: 4,
      vote_intention: 'si',
      electoral_priority: 'alta',
      campaign_role: 'lider_barrial',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid vote_intention', () => {
    const result = stepPoliticalSchema.safeParse({ vote_intention: 'maybe' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid electoral_priority', () => {
    const result = stepPoliticalSchema.safeParse({ electoral_priority: 'urgente' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid campaign_role', () => {
    const result = stepPoliticalSchema.safeParse({ campaign_role: 'presidente' })
    expect(result.success).toBe(false)
  })
})

describe('stepAdditionalSchema', () => {
  it('accepts empty additional data (all optional)', () => {
    const result = stepAdditionalSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts full additional data', () => {
    const result = stepAdditionalSchema.safeParse({
      birth_date: '1990-05-15',
      gender: 'M',
      marital_status: 'soltero',
      contact_source: 'puerta_a_puerta',
      source_detail: 'Barrio Belén',
      referred_by: 'María López',
      mobilizes_count: 15,
      main_need: 'empleo',
      economic_sector: 'comercio',
      beneficiary_program: 'familias_en_accion',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid gender', () => {
    const result = stepAdditionalSchema.safeParse({ gender: 'X' })
    expect(result.success).toBe(false)
  })

  it('rejects negative mobilizes_count', () => {
    const result = stepAdditionalSchema.safeParse({ mobilizes_count: -1 })
    expect(result.success).toBe(false)
  })
})

describe('contactFormSchema (full)', () => {
  it('accepts a complete contact form', () => {
    const result = contactFormSchema.safeParse({
      first_name: 'Juan',
      last_name: 'Pérez',
      document_type: 'CC',
      document_number: '1234567890',
      phone: '3001234567',
      status: 'supporter',
      email: 'juan@test.com',
      department: 'Antioquia',
      municipality: 'Medellín',
      political_affinity: 4,
      vote_intention: 'si',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when required fields are missing', () => {
    const result = contactFormSchema.safeParse({
      first_name: 'Juan',
      // missing last_name, document_type, phone, status, email, document_number
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty document_number', () => {
    const result = contactFormSchema.safeParse({
      first_name: 'Juan',
      last_name: 'Pérez',
      document_type: 'CC',
      document_number: '',
      phone: '3001234567',
      status: 'supporter',
      email: 'juan@test.com',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing document_number', () => {
    const result = contactFormSchema.safeParse({
      first_name: 'Juan',
      last_name: 'Pérez',
      document_type: 'CC',
      phone: '3001234567',
      status: 'supporter',
      email: 'juan@test.com',
    })
    expect(result.success).toBe(false)
  })

  it('accepts mobilizes_count as empty string (preprocess)', () => {
    const result = stepAdditionalSchema.safeParse({ mobilizes_count: '' })
    expect(result.success).toBe(true)
  })

  it('accepts mobilizes_count as NaN (preprocess)', () => {
    const result = stepAdditionalSchema.safeParse({ mobilizes_count: NaN })
    expect(result.success).toBe(true)
  })
})
