import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

// ── Column definitions ──────────────────────────────────────────────────────

const TEMPLATE_COLUMNS = [
  { header: 'Nombre',                        key: 'first_name',         required: true,  example: 'María' },
  { header: 'Apellido',                      key: 'last_name',          required: true,  example: 'García López' },
  { header: 'Nro. Documento',                key: 'document_number',    required: false, example: '1234567890' },
  { header: 'Tipo Documento',                key: 'document_type',      required: false, example: 'CC' },
  { header: 'Teléfono',                      key: 'phone',              required: false, example: '3001234567' },
  { header: 'Teléfono Alterno',              key: 'phone_alternate',    required: false, example: '3107654321' },
  { header: 'Correo',                        key: 'email',              required: false, example: 'maria.garcia@email.com' },
  { header: 'Fecha Nacimiento (DD/MM/AAAA)', key: 'birth_date',         required: false, example: '15/03/1985' },
  { header: 'Género',                        key: 'gender',             required: false, example: 'F' },
  { header: 'Estado Civil',                  key: 'marital_status',     required: false, example: 'Casado/a' },
  { header: 'Dirección',                     key: 'address',            required: false, example: 'Calle 45 # 23-10' },
  { header: 'Departamento',                  key: 'department',         required: false, example: 'Antioquia' },
  { header: 'Municipio',                     key: 'municipality',       required: false, example: 'Medellín' },
  { header: 'Comuna',                        key: 'commune',            required: false, example: 'Laureles' },
  { header: 'Barrio / Vereda',               key: 'district',           required: false, example: 'El Poblado' },
  { header: 'Sector',                        key: 'sector',             required: false, example: 'Norte' },
  { header: 'Puesto de Votación',            key: 'voting_place',       required: false, example: 'Colegio San José' },
  { header: 'Mesa de Votación',              key: 'voting_table',       required: false, example: '042' },
  { header: 'Estado del Contacto',           key: 'status',             required: false, example: 'undecided' },
  { header: 'Afinidad Política',             key: 'political_affinity', required: false, example: 'Centro' },
  { header: 'Intención de Voto',             key: 'vote_intention',     required: false, example: 'Voto seguro' },
  { header: 'Partido Preferido',             key: 'preferred_party',    required: false, example: '' },
  { header: 'Prioridad Electoral',           key: 'electoral_priority', required: false, example: 'Alta' },
  { header: 'Rol en Campaña',                key: 'campaign_role',      required: false, example: 'Testigo' },
  { header: 'Fuente de Captura',             key: 'capture_source',     required: false, example: 'Puerta a puerta' },
  { header: 'Detalle de Fuente',             key: 'source_detail',      required: false, example: '' },
  { header: 'Líder que Refiere',             key: 'referred_by',        required: false, example: 'Carlos Peñaloza' },
  { header: 'Votos que Moviliza',            key: 'mobilizes_count',    required: false, example: '5' },
  { header: 'Necesidad Principal',           key: 'main_need',          required: false, example: 'Empleo' },
  { header: 'Sector Económico',              key: 'economic_sector',    required: false, example: 'Comercio' },
  { header: 'Beneficiario de Programa',      key: 'beneficiary_program',required: false, example: '' },
  { header: 'Etiquetas (separadas por coma)',key: 'tags',               required: false, example: 'lider,zona-norte' },
  { header: 'Notas',                         key: 'notes',              required: false, example: 'Contactada en evento comunitario' },
]

// ── Route handler ───────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wb = XLSX.utils.book_new()

  // ── Hoja 1: Plantilla ────────────────────────────────────────────────────

  const headers = TEMPLATE_COLUMNS.map(c => c.header)
  const exampleRow = TEMPLATE_COLUMNS.map(c => c.example)

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])

  // Style header row: blue background, white bold text
  const headerStyle = {
    fill: { fgColor: { rgb: '2262EC' } },
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', wrapText: false },
  }

  for (let col = 0; col < headers.length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!ws[cellRef]) ws[cellRef] = { v: headers[col], t: 's' }
    ws[cellRef].s = headerStyle
  }

  // Column widths based on content length
  ws['!cols'] = TEMPLATE_COLUMNS.map(c => ({
    wch: Math.max(c.header.length, c.example.length, 12) + 2,
  }))

  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')

  // ── Hoja 2: Instrucciones ────────────────────────────────────────────────

  const instructionRows: string[][] = [
    ['GUÍA DE CAMPOS — Plantilla de importación de contactos Scrutix'],
    [''],
    ['Campo', 'Obligatorio', 'Valores aceptados / Formato', 'Notas'],
    ['Nombre', 'SÍ', 'Texto libre', 'Nombre(s) del contacto'],
    ['Apellido', 'SÍ', 'Texto libre', 'Apellido(s) del contacto'],
    ['Nro. Documento', 'No', 'Número sin puntos ni comas', 'Cédula de ciudadanía u otro documento'],
    ['Tipo Documento', 'No', 'CC | CE | PA | TI | RC', 'CC = Cédula de ciudadanía (más común)'],
    ['Teléfono', 'No', '10 dígitos sin espacios', 'Número celular principal'],
    ['Teléfono Alterno', 'No', '10 dígitos sin espacios', 'Número celular secundario'],
    ['Correo', 'No', 'email@dominio.com', 'Correo electrónico'],
    ['Fecha Nacimiento (DD/MM/AAAA)', 'No', 'DD/MM/AAAA  ej: 15/03/1985', 'Formato día/mes/año de 4 dígitos'],
    ['Género', 'No', 'M | F | otro', ''],
    ['Estado Civil', 'No', 'Texto libre', 'Soltero/a, Casado/a, etc.'],
    ['Dirección', 'No', 'Texto libre', 'Dirección de residencia (se geolocaliza automáticamente)'],
    ['Departamento', 'No', 'Nombre completo', 'Ej: Antioquia, Cundinamarca'],
    ['Municipio', 'No', 'Nombre completo', ''],
    ['Comuna', 'No', 'Texto libre', ''],
    ['Barrio / Vereda', 'No', 'Texto libre', ''],
    ['Sector', 'No', 'Texto libre', ''],
    ['Puesto de Votación', 'No', 'Texto libre', 'Nombre del puesto de votación asignado'],
    ['Mesa de Votación', 'No', 'Número', 'Número de mesa'],
    ['Estado del Contacto', 'No', 'supporter | undecided | opponent | unknown', 'Si se deja vacío queda como unknown'],
    ['Afinidad Política', 'No', 'Texto libre', ''],
    ['Intención de Voto', 'No', 'Texto libre', ''],
    ['Partido Preferido', 'No', 'Texto libre', ''],
    ['Prioridad Electoral', 'No', 'Alta | Media | Baja', ''],
    ['Rol en Campaña', 'No', 'Texto libre', 'Ej: Testigo, Líder de barrio, Promotor'],
    ['Fuente de Captura', 'No', 'Texto libre', 'Ej: Puerta a puerta, Evento, Referido'],
    ['Detalle de Fuente', 'No', 'Texto libre', ''],
    ['Líder que Refiere', 'No', 'Nombre del líder', ''],
    ['Votos que Moviliza', 'No', 'Número entero', 'Cuántos votos puede movilizar este contacto'],
    ['Necesidad Principal', 'No', 'Texto libre', 'Ej: Empleo, Salud, Vivienda'],
    ['Sector Económico', 'No', 'Texto libre', 'Ej: Comercio, Educación, Construcción'],
    ['Beneficiario de Programa', 'No', 'Texto libre', ''],
    ['Etiquetas (separadas por coma)', 'No', 'etiqueta1,etiqueta2,etiqueta3', 'Sin espacios entre comas'],
    ['Notas', 'No', 'Texto libre', 'Observaciones generales del contacto'],
    [''],
    ['IMPORTANTE: No modifiques los encabezados de la hoja "Plantilla". Solo llena los datos desde la fila 3 en adelante.'],
    ['Los campos marcados como SÍ son obligatorios. Las filas sin Nombre o Apellido serán omitidas.'],
    ['Para Estado del Contacto usa exactamente: supporter, undecided, opponent o unknown (en inglés).'],
  ]

  const wsInst = XLSX.utils.aoa_to_sheet(instructionRows)

  // Style title and header row of instructions
  if (wsInst['A1']) wsInst['A1'].s = { font: { bold: true, sz: 14, color: { rgb: '2262EC' } } }
  const instHeaders = ['A4', 'B4', 'C4', 'D4']
  for (const ref of instHeaders) {
    if (wsInst[ref]) wsInst[ref].s = { font: { bold: true }, fill: { fgColor: { rgb: 'EEF2FF' } } }
  }

  wsInst['!cols'] = [{ wch: 34 }, { wch: 12 }, { wch: 45 }, { wch: 50 }]

  XLSX.utils.book_append_sheet(wb, wsInst, 'Instrucciones')

  // ── Serialize and return ─────────────────────────────────────────────────

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla_contactos_scrutix.xlsx"',
    },
  })
}
