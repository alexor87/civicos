import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/import/contacts/template/route'
import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

const mockSupabase = {
  auth: { getUser: vi.fn() },
}

beforeEach(() => {
  vi.resetAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
})

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/import/contacts/template')
}

describe('GET /api/import/contacts/template', () => {
  it('retorna 401 si no hay sesión', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('retorna 200 con usuario autenticado', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
  })

  it('Content-Type es XLSX', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const res = await GET(makeRequest())
    expect(res.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  })

  it('Content-Disposition tiene el nombre de archivo correcto', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const res = await GET(makeRequest())
    const disposition = res.headers.get('Content-Disposition')
    expect(disposition).toContain('attachment')
    expect(disposition).toContain('plantilla_contactos_scrutix.xlsx')
  })

  it('el XLSX tiene exactamente 2 hojas', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const res = await GET(makeRequest())
    const buf = await res.arrayBuffer()
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })

    expect(wb.SheetNames).toHaveLength(2)
    expect(wb.SheetNames[0]).toBe('Plantilla')
    expect(wb.SheetNames[1]).toBe('Instrucciones')
  })

  it('la hoja Plantilla tiene 33 columnas', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const res = await GET(makeRequest())
    const buf = await res.arrayBuffer()
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })

    const ws = wb.Sheets['Plantilla']
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
    expect(rows[0]).toHaveLength(34)
  })

  it('la fila de encabezados contiene los campos obligatorios', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const res = await GET(makeRequest())
    const buf = await res.arrayBuffer()
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })

    const ws = wb.Sheets['Plantilla']
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
    const headers = rows[0]

    expect(headers).toContain('Nombre')
    expect(headers).toContain('Apellido')
    expect(headers).toContain('Nro. Documento')
    expect(headers).toContain('Teléfono')
    expect(headers).toContain('Correo')
  })

  it('la fila de ejemplo (fila 2) tiene datos', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const res = await GET(makeRequest())
    const buf = await res.arrayBuffer()
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })

    const ws = wb.Sheets['Plantilla']
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]

    // Fila 2 (índice 1) debe tener al menos Nombre y Apellido
    expect(rows[1][0]).toBeTruthy() // Nombre
    expect(rows[1][1]).toBeTruthy() // Apellido
  })

  it('la hoja Instrucciones tiene contenido', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const res = await GET(makeRequest())
    const buf = await res.arrayBuffer()
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })

    const ws = wb.Sheets['Instrucciones']
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]

    // Debe tener un título en A1
    expect(rows[0][0]).toBeTruthy()
    // Debe tener más de 10 filas de instrucciones
    expect(rows.length).toBeGreaterThan(10)
  })
})
