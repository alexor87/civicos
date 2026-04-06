'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Columns3, Download } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// ── Importable fields (DB columns + metadata fields) ────────────────────────

const IMPORTABLE_FIELDS = [
  // Datos básicos
  { value: 'first_name', label: 'Nombre', required: true },
  { value: 'last_name', label: 'Apellido', required: true },
  { value: 'email', label: 'Correo electrónico' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'phone_alternate', label: 'Teléfono alterno' },
  { value: 'document_type', label: 'Tipo de documento' },
  { value: 'document_number', label: 'Nro. documento' },
  { value: 'birth_date', label: 'Fecha de nacimiento' },
  { value: 'gender', label: 'Género' },
  { value: 'marital_status', label: 'Estado civil' },
  // Ubicación
  { value: 'address', label: 'Dirección' },
  { value: 'city', label: 'Ciudad' },
  { value: 'district', label: 'Barrio / Vereda' },
  { value: 'sector', label: 'Sector' },
  { value: 'department', label: 'Departamento' },
  { value: 'municipality', label: 'Municipio' },
  { value: 'commune', label: 'Comuna' },
  { value: 'voting_place', label: 'Puesto de votación' },
  { value: 'voting_table', label: 'Mesa de votación' },
  // Perfil político
  { value: 'status', label: 'Estado del contacto' },
  { value: 'political_affinity', label: 'Afinidad política' },
  { value: 'vote_intention', label: 'Intención de voto' },
  { value: 'preferred_party', label: 'Partido preferido' },
  { value: 'electoral_priority', label: 'Prioridad electoral' },
  { value: 'campaign_role', label: 'Rol en campaña' },
  // Adicional
  { value: 'capture_source', label: 'Fuente de captura' },
  { value: 'source_detail', label: 'Detalle de fuente' },
  { value: 'referred_by', label: 'Líder que refiere' },
  { value: 'mobilizes_count', label: 'Votos que moviliza' },
  { value: 'main_need', label: 'Necesidad principal' },
  { value: 'economic_sector', label: 'Sector económico' },
  { value: 'beneficiary_program', label: 'Beneficiario de programa' },
  { value: 'notes', label: 'Notas' },
  { value: 'tags', label: 'Etiquetas' },
] as const

// ── Auto-mapping aliases ────────────────────────────────────────────────────

const HEADER_ALIASES: Record<string, string> = {
  nombre: 'first_name', apellido: 'last_name', apellidos: 'last_name',
  first_name: 'first_name', last_name: 'last_name',
  telefono: 'phone', 'teléfono': 'phone', phone: 'phone', celular: 'phone',
  correo: 'email', 'correo electronico': 'email', 'correo electrónico': 'email', email: 'email',
  'nro cc': 'document_number', cedula: 'document_number', 'cédula': 'document_number',
  documento: 'document_number', document_number: 'document_number',
  'puesto de votacion': 'voting_place', 'puesto de votación': 'voting_place', voting_place: 'voting_place',
  mesa: 'voting_table', 'mesa de': 'voting_table', voting_table: 'voting_table',
  'fecha de nacimiento': 'birth_date', birth_date: 'birth_date',
  direccion: 'address', 'dirección': 'address', address: 'address',
  barrio: 'district', 'barrio/vereda': 'district', vereda: 'district', district: 'district',
  ciudad: 'city', city: 'city',
  comuna: 'commune', origen: 'commune', commune: 'commune',
  referido: 'referred_by', 'nombre de lider/referido': 'referred_by',
  'lider que refiere': 'referred_by', 'líder que refiere': 'referred_by',
  referred_by: 'referred_by',
  estado: 'status', status: 'status', notes: 'notes',
  departamento: 'department', department: 'department',
  municipio: 'municipality', municipality: 'municipality',
  genero: 'gender', 'género': 'gender', gender: 'gender',
  'telefono alterno': 'phone_alternate', 'celular alterno': 'phone_alternate',
  phone_alternate: 'phone_alternate',
  sector: 'sector',
  'afinidad politica': 'political_affinity', 'afinidad política': 'political_affinity',
  political_affinity: 'political_affinity',
  'intencion de voto': 'vote_intention', 'intención de voto': 'vote_intention',
  vote_intention: 'vote_intention',
  'partido preferido': 'preferred_party', preferred_party: 'preferred_party',
  'estado civil': 'marital_status', marital_status: 'marital_status',
  'detalle de fuente': 'source_detail', source_detail: 'source_detail',
  'votos que moviliza': 'mobilizes_count', mobilizes_count: 'mobilizes_count',
  'necesidad principal': 'main_need', main_need: 'main_need',
  'sector economico': 'economic_sector', 'sector económico': 'economic_sector',
  economic_sector: 'economic_sector',
  'beneficiario de programa': 'beneficiary_program', beneficiary_program: 'beneficiary_program',
  etiquetas: 'tags', tags: 'tags',
}

function autoMap(headers: string[]): Record<string, string | null> {
  const map: Record<string, string | null> = {}
  const usedFields = new Set<string>()

  for (const h of headers) {
    const key = h.trim().toLowerCase()
    const match = HEADER_ALIASES[key]
    if (match && !usedFields.has(match)) {
      map[h] = match
      usedFields.add(match)
    } else {
      map[h] = null
    }
  }
  return map
}

// ── Types ───────────────────────────────────────────────────────────────────

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

type ImportStep = 'upload' | 'mapping' | 'done'

// ── Main component ──────────────────────────────────────────────────────────

export default function ImportContactsPage() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Parsed data
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [columnMap, setColumnMap] = useState<Record<string, string | null>>({})

  // Validation
  const mappedFields = useMemo(() => new Set(Object.values(columnMap).filter(Boolean)), [columnMap])
  const hasFirstName = mappedFields.has('first_name')
  const hasLastName = mappedFields.has('last_name')
  const canImport = hasFirstName && hasLastName

  // ── Step 1: Parse file ──────────────────────────────────────────────────

  async function handleFileParsed(parsedRows: Record<string, unknown>[]) {
    if (!parsedRows.length) {
      setError('El archivo no contiene datos')
      return
    }

    // Detect and skip Scrutix template metadata rows:
    // Row 2 = "✱ Obligatorio"/"Opcional" indicators, Row 3 = example row
    let dataRows = parsedRows
    const firstValues = Object.values(parsedRows[0] ?? {}).map(v => String(v ?? '').trim())
    const isMetaRow = firstValues.some(v => v === '✱ Obligatorio' || v === 'Opcional')
    if (isMetaRow) {
      dataRows = parsedRows.slice(2)
    }

    if (!dataRows.length) {
      setError('El archivo no contiene datos')
      return
    }

    const fileHeaders = Object.keys(dataRows[0]).filter(h => h.trim())
    setHeaders(fileHeaders)
    setRawRows(dataRows)
    setColumnMap(autoMap(fileHeaders))
    setStep('mapping')
  }

  async function handleFileUpload() {
    if (!file) return
    setLoading(true)
    setError(null)

    const name = file.name.toLowerCase()
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls')

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        if (isExcel) {
          const buffer = e.target?.result as ArrayBuffer
          const workbook = XLSX.read(buffer, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }) as Record<string, unknown>[]
          handleFileParsed(rows)
        } else {
          const csv = e.target?.result as string
          Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (parsed) => handleFileParsed(parsed.data as Record<string, unknown>[]),
            error: (err: Error) => setError(`Error al parsear CSV: ${err.message}`),
          })
        }
      } catch (err) {
        setError(`Error al parsear archivo: ${err instanceof Error ? err.message : 'desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    if (isExcel) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }

  // ── Step 2: Apply mapping and import ────────────────────────────────────

  async function handleImport() {
    setLoading(true)
    setError(null)

    // Apply mapping: transform raw rows to DB field names
    const mappedRows = rawRows.map(row => {
      const mapped: Record<string, string> = {}
      for (const [fileHeader, dbField] of Object.entries(columnMap)) {
        if (!dbField) continue
        const val = row[fileHeader]
        const strVal = typeof val === 'number' ? String(val) : (val as string) ?? ''
        if (strVal.trim()) {
          // If multiple file columns map to same field (e.g. notes), concatenate
          if (mapped[dbField]) {
            mapped[dbField] = `${mapped[dbField]} | ${strVal.trim()}`
          } else {
            mapped[dbField] = strVal.trim()
          }
        }
      }
      return mapped
    })

    try {
      const res = await fetch('/api/import/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: mappedRows, preMapped: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setLoading(false)
    }
  }

  // ── Column mapping change ───────────────────────────────────────────────

  function handleMapChange(fileHeader: string, value: string) {
    setColumnMap(prev => ({
      ...prev,
      [fileHeader]: value === '__ignore__' ? null : value,
    }))
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        {step === 'mapping' ? (
          <Button variant="ghost" size="sm" onClick={() => { setStep('upload'); setHeaders([]); setRawRows([]); setFile(null) }}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Cambiar archivo
          </Button>
        ) : (
          <Link href="/dashboard/contacts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Importar contactos</h1>
          <p className="text-slate-500 text-sm">
            {step === 'upload' && 'Sube un archivo CSV o Excel para importar contactos masivamente'}
            {step === 'mapping' && 'Asigna las columnas de tu archivo a los campos de Scrutix'}
            {step === 'done' && 'Importación completada'}
          </p>
        </div>
      </div>

      {/* ── Step 1: Upload ─────────────────────────────────────────────────── */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Formato del archivo</CardTitle>
            <CardDescription>
              Acepta CSV, XLSX y XLS. Después de subir el archivo podrás asignar cada columna al campo correspondiente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Download className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">¿Primera vez importando?</p>
                <p className="text-xs text-blue-700 mt-0.5">Descarga nuestra plantilla oficial con todos los campos y un ejemplo de cómo llenarlos.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => { window.location.href = '/api/import/contacts/template' }}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Descargar plantilla Excel
              </Button>
            </div>

            <label className="flex flex-col items-center gap-3 border-2 border-dashed border-slate-200 rounded-lg p-4 md:p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="h-8 w-8 text-slate-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  {file ? file.name : 'Haz clic para seleccionar un archivo CSV o Excel'}
                </p>
                {file && (
                  <p className="text-xs text-slate-400 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {file && (
              <Button onClick={handleFileUpload} disabled={loading} className="w-full">
                {loading ? 'Leyendo archivo...' : (
                  <>
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Column Mapping ─────────────────────────────────────────── */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Columns3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Asignar columnas</CardTitle>
            </div>
            <CardDescription>
              {rawRows.length} filas detectadas en <span className="font-medium">{file?.name}</span>.
              Asigna cada columna al campo correspondiente o ignórala.
              {!canImport && (
                <span className="text-orange-600 font-medium ml-1">
                  Debes asignar al menos Nombre y Apellido.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">Columna del archivo</th>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600 w-16">Vista previa</th>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">Campo en Scrutix</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header) => {
                    const currentValue = columnMap[header]
                    const fieldInfo = IMPORTABLE_FIELDS.find(f => f.value === currentValue)
                    const isRequired = fieldInfo && 'required' in fieldInfo && fieldInfo.required

                    // Preview: first 2 non-empty values
                    const previews = rawRows
                      .slice(0, 5)
                      .map(r => {
                        const v = r[header]
                        return typeof v === 'number' ? String(v) : (v as string) ?? ''
                      })
                      .filter(v => v.trim())
                      .slice(0, 2)

                    return (
                      <tr key={header} className="border-b last:border-b-0 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                            {header}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-xs text-slate-400 truncate max-w-[180px]">
                            {previews.join(', ') || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Select
                            value={currentValue ?? '__ignore__'}
                            onValueChange={(val) => handleMapChange(header, val)}
                          >
                            <SelectTrigger className={`w-full max-w-[240px] h-9 text-sm ${isRequired ? 'border-blue-300 bg-blue-50/50' : ''}`}>
                              <SelectValue>
                                {currentValue
                                  ? IMPORTABLE_FIELDS.find(f => f.value === currentValue)?.label ?? currentValue
                                  : <span className="text-slate-400">— Ignorar —</span>}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__ignore__">
                                <span className="text-slate-400">— Ignorar —</span>
                              </SelectItem>
                              {IMPORTABLE_FIELDS.map(field => {
                                const isUsedElsewhere = Object.entries(columnMap).some(
                                  ([h, v]) => v === field.value && h !== header
                                )
                                return (
                                  <SelectItem
                                    key={field.value}
                                    value={field.value}
                                    disabled={isUsedElsewhere}
                                  >
                                    {field.label}
                                    {'required' in field && field.required && (
                                      <span className="text-red-500 ml-1">*</span>
                                    )}
                                    {isUsedElsewhere && (
                                      <span className="text-slate-400 ml-1">(ya asignado)</span>
                                    )}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {Object.values(columnMap).filter(Boolean).length} de {headers.length} columnas asignadas
              </p>
              <Button onClick={handleImport} disabled={!canImport || loading} className="min-w-[200px]">
                {loading ? 'Importando...' : `Importar ${rawRows.length} contactos`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Errors ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ── Step 3: Results ────────────────────────────────────────────────── */}
      {step === 'done' && result && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start gap-2 p-4 bg-green-50 rounded-lg text-green-700">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Importación completada</p>
                <p className="text-sm mt-1">
                  {result.imported} contactos importados · {result.skipped} omitidos (duplicados)
                </p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs font-medium text-orange-700 mb-1">Errores ({result.errors.length}):</p>
                {result.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-orange-600">{e}</p>
                ))}
              </div>
            )}
            <Button onClick={() => router.push('/dashboard/contacts')} className="w-full">
              Ver contactos importados
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
