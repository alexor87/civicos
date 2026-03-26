import { describe, it, expect } from 'vitest'

// Inline the same logic as ContactsTable's getProfileCompletion
function getProfileCompletion(contact: Record<string, unknown>): number {
  const meta = (contact.metadata as Record<string, unknown>) ?? {}
  const fields = [
    contact.first_name,
    contact.last_name,
    contact.phone,
    contact.email,
    contact.document_number,
    contact.department,
    contact.municipality ?? contact.city,
    contact.address,
    meta.political_affinity,
    meta.vote_intention,
  ]
  const filled = fields.filter((v) => v !== null && v !== undefined && v !== '').length
  return Math.round((filled / fields.length) * 100)
}

describe('getProfileCompletion', () => {
  it('returns 100 for fully complete contact', () => {
    const contact = {
      first_name: 'Ana',
      last_name: 'Gómez',
      phone: '3001234567',
      email: 'ana@example.com',
      document_number: '1234567890',
      department: 'Antioquia',
      municipality: 'Medellín',
      address: 'Calle 10 #20-30',
      metadata: { political_affinity: 5, vote_intention: 'yes' },
    }
    expect(getProfileCompletion(contact)).toBe(100)
  })

  it('returns 0 for empty contact', () => {
    const contact = {
      first_name: '',
      last_name: '',
      phone: null,
      email: null,
      document_number: '',
      department: '',
      municipality: '',
      address: '',
      metadata: {},
    }
    expect(getProfileCompletion(contact)).toBe(0)
  })

  it('returns correct percentage for partial contact', () => {
    const contact = {
      first_name: 'Juan',
      last_name: 'Pérez',
      phone: '3001234567',
      email: null,
      document_number: '',
      department: '',
      municipality: '',
      address: '',
      metadata: {},
    }
    // 3 out of 10 = 30%
    expect(getProfileCompletion(contact)).toBe(30)
  })

  it('uses city as fallback for municipality', () => {
    const contact = {
      first_name: 'Juan',
      last_name: 'Pérez',
      phone: null,
      email: null,
      document_number: '',
      department: '',
      city: 'Bogotá',
      address: '',
      metadata: {},
    }
    // 3 out of 10 = 30%
    expect(getProfileCompletion(contact)).toBe(30)
  })

  it('returns below 80 for contact missing metadata fields', () => {
    const contact = {
      first_name: 'Ana',
      last_name: 'Gómez',
      phone: '3001234567',
      email: 'ana@example.com',
      document_number: '123',
      department: 'Valle',
      municipality: 'Cali',
      address: '',
      metadata: {},
    }
    // 7 out of 10 = 70%
    expect(getProfileCompletion(contact)).toBe(70)
  })
})
