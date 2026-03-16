'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, CheckCircle, AlertCircle, MapPin, Trash2, FileJson, FileSpreadsheet, Eye, Flag, Target } from 'lucide-react'
import * as XLSX from 'xlsx'
import { COLOMBIA_ELECTION_TYPES, getElectionScope, type ElectionScope } from '@/lib/election-types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

interface GeoStats {
  departamentos: number
  municipios: number
  localidades: number
  upzs: number
  comunas: number
  corregimientos: number
  barrios: number
  veredas: number
}

interface PreviewRow {
  tipo: string
  nombre: string
  codigo?: string
  padre?: string
  poblacion?: string
}

interface GeoUnit {
  id: string
  name: string
  code?: string
}

interface CampaignScope {
  election_type: string | null
  geo_scope: {
    department_id?: string
    department_name?: string
    municipality_id?: string
    municipality_name?: string
  } | null
  departments: GeoUnit[]
  municipalities: GeoUnit[]
}

const TYPE_CONFIG = [
  { key: 'departamentos',  label: 'Departamentos',  color: 'text-blue-600 bg-blue-50'       },
  { key: 'municipios',     label: 'Municipios',     color: 'text-emerald-600 bg-emerald-50' },
  { key: 'localidades',    label: 'Localidades',    color: 'text-teal-600 bg-teal-50'       },
  { key: 'upzs',           label: 'UPZ',            color: 'text-cyan-600 bg-cyan-50'       },
  { key: 'comunas',        label: 'Comunas',        color: 'text-violet-600 bg-violet-50'   },
  { key: 'corregimientos', label: 'Corregimientos', color: 'text-orange-600 bg-orange-50'   },
  { key: 'barrios',        label: 'Barrios',        color: 'text-purple-600 bg-purple-50'   },
  { key: 'veredas',        label: 'Veredas',        color: 'text-green-600 bg-green-50'     },
]

function badgeClass(tipo: string): string {
  switch (tipo) {
    case 'departamento':  return 'bg-blue-50 text-blue-600 border-blue-100'
    case 'municipio':     return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    case 'localidad':     return 'bg-teal-50 text-teal-600 border-teal-100'
    case 'upz':           return 'bg-cyan-50 text-cyan-600 border-cyan-100'
    case 'comuna':        return 'bg-violet-50 text-violet-600 border-violet-100'
    case 'corregimiento': return 'bg-orange-50 text-orange-600 border-orange-100'
    case 'vereda':        return 'bg-green-50 text-green-600 border-green-100'
    default:              return 'bg-purple-50 text-purple-600 border-purple-100'
  }
}

// ── Colombia department code → name ───────────────────────────────────────────
const DEPT_NAMES: Record<string, string> = {
  '05': 'Antioquia',
  '08': 'Atlántico',
  '11': 'Bogotá D.C.',
  '13': 'Bolívar',
  '17': 'Caldas',
  '50': 'Meta',
  '54': 'Norte de Santander',
  '63': 'Quindío',
  '66': 'Risaralda',
  '68': 'Santander',
  '73': 'Tolima',
  '76': 'Valle del Cauca',
}

interface ColombiaBarrio { nombre: string; sectores?: string[] }
interface ColombiaUpz    { codigo: string; nombre: string; barrios?: string[] }
interface ColombiaLocalidad {
  codigo: string; nombre: string
  upz?: ColombiaUpz[]
  barrios?: string[]
}
interface ColombiaComuna { codigo: string; nombre: string; barrios?: (string | ColombiaBarrio)[] }
interface ColombiaCorregimiento { codigo: string; nombre: string; veredas?: string[] }
interface CiudadEntry {
  municipio_codigo: string; municipio_nombre: string; departamento_codigo: string
  localidades?: ColombiaLocalidad[]
  comunas?: ColombiaComuna[]
  corregimientos?: ColombiaCorregimiento[]
}

export default function GeoDataPage() {
  // ── Import state ────────────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null)
  const [pendingRows, setPendingRows] = useState<PreviewRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<GeoStats | null>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [clearing, setClearing] = useState(false)

  // ── Scope state ─────────────────────────────────────────────────────────────
  const [scopeData, setScopeData] = useState<CampaignScope | null>(null)
  const [electionType, setElectionType] = useState('')
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [selectedDeptName, setSelectedDeptName] = useState('')
  const [selectedMuniId, setSelectedMuniId] = useState('')
  const [selectedMuniName, setSelectedMuniName] = useState('')
  const [municipalities, setMunicipalities] = useState<GeoUnit[]>([])
  const [savingScope, setSavingScope] = useState(false)
  const [scopeSuccess, setScopeSuccess] = useState(false)

  const electionScope: ElectionScope | null = getElectionScope(electionType)

  const loadStats = useCallback(async () => {
    const res = await fetch('/api/import/geo-units')
    if (res.ok) setStats(await res.json())
  }, [])

  const loadScope = useCallback(async () => {
    const res = await fetch('/api/campaigns/scope')
    if (!res.ok) return
    const data: CampaignScope = await res.json()
    setScopeData(data)
    setElectionType(data.election_type ?? '')
    setSelectedDeptId(data.geo_scope?.department_id ?? '')
    setSelectedDeptName(data.geo_scope?.department_name ?? '')
    setSelectedMuniId(data.geo_scope?.municipality_id ?? '')
    setSelectedMuniName(data.geo_scope?.municipality_name ?? '')
    setMunicipalities(data.municipalities ?? [])
  }, [])

  useEffect(() => {
    loadStats()
    loadScope()
  }, [loadStats, loadScope])

  async function handleDeptChange(deptId: string, deptName: string) {
    setSelectedDeptId(deptId)
    setSelectedDeptName(deptName)
    setSelectedMuniId('')
    setSelectedMuniName('')
    setMunicipalities([])

    if (!deptId) return

    // Save dept selection immediately so municipalities can be fetched
    await fetch('/api/campaigns/scope', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        election_type: electionType || undefined,
        geo_scope: { department_id: deptId, department_name: deptName },
      }),
    })

    // Reload to get updated municipalities list
    const res = await fetch('/api/campaigns/scope')
    if (res.ok) {
      const data: CampaignScope = await res.json()
      setMunicipalities(data.municipalities ?? [])
    }
  }

  async function handleSaveScope() {
    setSavingScope(true)
    setScopeSuccess(false)

    const geoScope: Record<string, string> = {}
    if (selectedDeptId)  { geoScope.department_id = selectedDeptId; geoScope.department_name = selectedDeptName }
    if (selectedMuniId)  { geoScope.municipality_id = selectedMuniId; geoScope.municipality_name = selectedMuniName }

    const res = await fetch('/api/campaigns/scope', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        election_type: electionType || undefined,
        geo_scope: Object.keys(geoScope).length > 0 ? geoScope : undefined,
      }),
    })

    setSavingScope(false)
    if (res.ok) {
      setScopeSuccess(true)
      setTimeout(() => setScopeSuccess(false), 3000)
    }
  }

  // ── Colombia format detection & parser ────────────────────────────────────
  function isColombiaFormat(parsed: unknown): boolean {
    if (typeof parsed !== 'object' || !parsed) return false
    const p = parsed as Record<string, unknown>
    return Array.isArray(p.ciudades) && typeof p.metadata === 'object'
  }

  function parseColombiaFormat(data: { ciudades: CiudadEntry[] }): PreviewRow[] {
    const rows: PreviewRow[] = []
    const deptosSeen = new Set<string>()

    for (const ciudad of data.ciudades) {
      const deptCodigo = ciudad.departamento_codigo
      const deptNombre = DEPT_NAMES[deptCodigo] ?? `Departamento ${deptCodigo}`

      if (!deptosSeen.has(deptCodigo)) {
        rows.push({ tipo: 'departamento', nombre: deptNombre, codigo: deptCodigo })
        deptosSeen.add(deptCodigo)
      }

      const munNombre = ciudad.municipio_nombre
      rows.push({ tipo: 'municipio', nombre: munNombre, codigo: ciudad.municipio_codigo, padre: deptNombre })

      for (const loc of ciudad.localidades ?? []) {
        rows.push({ tipo: 'localidad', nombre: loc.nombre, codigo: loc.codigo, padre: munNombre })
        if (loc.upz && loc.upz.length > 0) {
          for (const upz of loc.upz) {
            rows.push({ tipo: 'upz', nombre: upz.nombre, codigo: upz.codigo, padre: loc.nombre })
            for (const barrio of upz.barrios ?? []) {
              rows.push({ tipo: 'barrio', nombre: barrio, padre: upz.nombre })
            }
          }
        } else {
          for (const barrio of loc.barrios ?? []) {
            rows.push({ tipo: 'barrio', nombre: barrio, padre: loc.nombre })
          }
        }
      }

      for (const comuna of ciudad.comunas ?? []) {
        rows.push({ tipo: 'comuna', nombre: comuna.nombre, codigo: comuna.codigo, padre: munNombre })
        for (const barrio of comuna.barrios ?? []) {
          if (typeof barrio === 'string') {
            rows.push({ tipo: 'barrio', nombre: barrio, padre: comuna.nombre })
          } else {
            const b = barrio as ColombiaBarrio
            rows.push({ tipo: 'barrio', nombre: b.nombre, padre: comuna.nombre })
            for (const sector of b.sectores ?? []) {
              rows.push({ tipo: 'barrio', nombre: sector, padre: b.nombre })
            }
          }
        }
      }

      for (const corr of ciudad.corregimientos ?? []) {
        rows.push({ tipo: 'corregimiento', nombre: corr.nombre, codigo: corr.codigo, padre: munNombre })
        for (const vereda of corr.veredas ?? []) {
          rows.push({ tipo: 'vereda', nombre: vereda, padre: corr.nombre })
        }
      }
    }

    return rows
  }

  // ── JEOZ survey format detection & parser ─────────────────────────────────
  function isJEOZFormat(arr: unknown[]): boolean {
    if (!arr.length) return false
    const first = arr[0] as Record<string, unknown>
    return typeof first.titulo === 'string' && Array.isArray(first.opciones)
  }

  function normalizeText(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  }

  function parseJEOZFormat(arr: unknown[]): PreviewRow[] {
    const rows: PreviewRow[] = []
    const municipioNames: string[] = []
    let firstListDone = false
    let mode: 'municipios' | 'barrios' | 'sectores' | 'veredas' = 'municipios'
    let currentMunicipio = ''
    let currentBarrio = ''

    for (const rawItem of arr) {
      if (typeof rawItem !== 'object' || !rawItem) continue
      const item = rawItem as Record<string, unknown>
      const titulo = String(item.titulo ?? '').trim()
      const tipo   = String(item.tipo ?? '')
      const opciones = (item.opciones as unknown[]) ?? []

      if (tipo === 'PAGE_BREAK') {
        if (/^barrios\s/i.test(titulo)) {
          const raw = titulo.replace(/^barrios\s+/i, '').trim()
          currentMunicipio = municipioNames.find(n => normalizeText(n) === normalizeText(raw)) ?? raw
          currentBarrio = ''
          mode = 'barrios'
        } else if (/^sectores\s/i.test(titulo)) {
          currentBarrio = titulo.replace(/^sectores\s+/i, '').trim()
          mode = 'sectores'
        } else if (/^veredas\s/i.test(titulo)) {
          const raw = titulo.replace(/^veredas\s+/i, '').trim()
          currentMunicipio = municipioNames.find(n => normalizeText(n) === normalizeText(raw)) ?? raw
          currentBarrio = ''
          mode = 'veredas'
        }
        continue
      }

      if (tipo === 'LIST' || tipo === 'MULTIPLE_CHOICE') {
        for (const opcion of opciones) {
          const nombre = String(opcion).trim()
          if (!nombre) continue
          if (!firstListDone) {
            rows.push({ tipo: 'municipio', nombre })
            municipioNames.push(nombre)
          } else if (mode === 'barrios') {
            rows.push({ tipo: 'barrio', nombre, padre: currentMunicipio })
          } else if (mode === 'sectores') {
            rows.push({ tipo: 'barrio', nombre, padre: currentBarrio })
          } else if (mode === 'veredas') {
            rows.push({ tipo: 'barrio', nombre, padre: currentMunicipio })
          }
        }
        firstListDone = true
      }
    }
    return rows
  }

  // ── Parse file into rows ───────────────────────────────────────────────────
  async function parseFile(f: File): Promise<{ rows: PreviewRow[]; total: number }> {
    const ext = f.name.split('.').pop()?.toLowerCase()

    if (ext === 'json') {
      const parsed = JSON.parse(await f.text())
      if (isColombiaFormat(parsed)) {
        const flat = parseColombiaFormat(parsed as { ciudades: CiudadEntry[] })
        return { rows: flat, total: flat.length }
      }
      const arr = Array.isArray(parsed) ? parsed : [parsed]
      const flat = isJEOZFormat(arr) ? parseJEOZFormat(arr) : flattenNested(arr)
      return { rows: flat, total: flat.length }
    }

    const buffer = await f.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })

    const rows = raw.map(r => ({
      tipo:      String(r.tipo ?? r.type ?? r.Tipo ?? r.Type ?? '').toLowerCase().trim(),
      nombre:    String(r.nombre ?? r.name ?? r.Nombre ?? r.Name ?? '').trim(),
      codigo:    String(r.codigo ?? r.code ?? r.Codigo ?? r.Code ?? '').trim() || undefined,
      padre:     String(r.padre ?? r.parent ?? r.Padre ?? r.Parent ?? '').trim() || undefined,
      poblacion: String(r.poblacion ?? r.population ?? r.Poblacion ?? r.Population ?? '').trim() || undefined,
    })).filter(r => r.nombre)

    return { rows, total: rows.length }
  }

  function flattenNested(arr: unknown[]): PreviewRow[] {
    const flat: PreviewRow[] = []
    for (const dept of arr) {
      if (typeof dept !== 'object' || !dept) continue
      const d = dept as Record<string, unknown>
      const deptName = String(d.nombre ?? d.name ?? '')
      flat.push({ tipo: 'departamento', nombre: deptName, codigo: String(d.codigo ?? d.code ?? '') || undefined })
      const municipios = (d.municipios ?? d.cities ?? []) as unknown[]
      for (const mun of municipios) {
        if (typeof mun !== 'object' || !mun) continue
        const m = mun as Record<string, unknown>
        const munName = String(m.nombre ?? m.name ?? '')
        flat.push({ tipo: 'municipio', nombre: munName, padre: deptName })
        const barrios = (m.barrios ?? m.neighborhoods ?? []) as unknown[]
        for (const bar of barrios) {
          const barName = typeof bar === 'string' ? bar : String((bar as Record<string, unknown>).nombre ?? (bar as Record<string, unknown>).name ?? '')
          flat.push({ tipo: 'barrio', nombre: barName, padre: munName })
        }
      }
    }
    return flat
  }

  async function handleFileSelect(f: File) {
    setFile(f)
    setPendingRows(null)
    setResult(null)
    setError(null)
    try {
      const { rows, total } = await parseFile(f)
      setPreview(rows.slice(0, 10))
      setTotalRows(total)
    } catch {
      setError('No se pudo leer el archivo. Verifica que sea un CSV, XLSX o JSON válido.')
    }
  }

  async function handleLoadColombia() {
    setFile(null)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/geo/colombia.json')
      const data = await res.json()
      const rows = parseColombiaFormat(data as { ciudades: CiudadEntry[] })
      setPendingRows(rows)
      setPreview(rows.slice(0, 10))
      setTotalRows(rows.length)
    } catch {
      setError('No se pudo cargar los datos de Colombia.')
    }
  }

  async function handleImport() {
    const rowsToImport = pendingRows ?? (file ? (await parseFile(file)).rows : null)
    if (!rowsToImport) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/import/geo-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToImport }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setFile(null)
      setPendingRows(null)
      setPreview([])
      setTotalRows(0)
      loadStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setLoading(false)
    }
  }

  async function handleClear() {
    if (!confirm('¿Eliminar toda la base geográfica de esta campaña? Esta acción no se puede deshacer.')) return
    setClearing(true)
    const res = await fetch('/api/import/geo-units?confirm=true', { method: 'DELETE' })
    if (res.ok) { loadStats(); setResult(null) }
    setClearing(false)
  }

  const activeStats = TYPE_CONFIG.filter(c => (stats?.[c.key as keyof GeoStats] ?? 0) > 0)
  const totalUnits = TYPE_CONFIG.reduce((sum, c) => sum + (stats?.[c.key as keyof GeoStats] ?? 0), 0)
  const hasRowsReady = (file || pendingRows) && !result

  const selectedElectionLabel = COLOMBIA_ELECTION_TYPES.find(t => t.value === electionType)?.label

  return (
    <div className="flex-1 p-8 space-y-8 animate-page-in">
      {/* Header */}
      <div>
        <h3 className="text-3xl font-black tracking-tight text-slate-900">Base Geográfica</h3>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Configura el ámbito de tu campaña y administra la base de unidades geográficas
        </p>
      </div>

      {/* ── Section 1: Ámbito de la campaña ──────────────────────────────────── */}
      <Card className="border border-slate-200 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Ámbito de la campaña
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Define el cargo al que aspiras y la zona geográfica donde opera tu campaña
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Election type selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Cargo al que aspiras</label>
            <select
              value={electionType}
              onChange={e => setElectionType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Selecciona un cargo...</option>
              {COLOMBIA_ELECTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Geo selectors — shown conditionally based on election scope */}
          {electionScope === 'nacional' && (
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg">
              <Flag className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-sm font-medium text-blue-700">Cobertura nacional — Colombia</p>
            </div>
          )}

          {(electionScope === 'departamental') && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Departamento</label>
              <select
                value={selectedDeptId}
                onChange={e => {
                  const opt = e.target.options[e.target.selectedIndex]
                  handleDeptChange(e.target.value, opt.text)
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecciona un departamento...</option>
                {(scopeData?.departments ?? []).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {(electionScope === 'municipal' || electionScope === 'local') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Departamento</label>
                <select
                  value={selectedDeptId}
                  onChange={e => {
                    const opt = e.target.options[e.target.selectedIndex]
                    handleDeptChange(e.target.value, opt.text)
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecciona un departamento...</option>
                  {(scopeData?.departments ?? []).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Municipio</label>
                <select
                  value={selectedMuniId}
                  onChange={e => {
                    const opt = e.target.options[e.target.selectedIndex]
                    setSelectedMuniId(e.target.value)
                    setSelectedMuniName(opt.text)
                  }}
                  disabled={!selectedDeptId || municipalities.length === 0}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{selectedDeptId ? 'Selecciona un municipio...' : 'Primero selecciona un departamento'}</option>
                  {municipalities.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Save button + success */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSaveScope}
              disabled={savingScope || !electionType}
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-md shadow-primary/20"
            >
              {savingScope ? 'Guardando...' : 'Guardar ámbito'}
            </Button>
            {scopeSuccess && (
              <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                Ámbito actualizado
              </div>
            )}
          </div>

          {/* Current scope summary */}
          {(scopeData?.election_type || scopeData?.geo_scope?.department_name) && (
            <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600">
              <span className="font-medium text-slate-700">Configuración actual: </span>
              {selectedElectionLabel ?? scopeData.election_type}
              {scopeData.geo_scope?.department_name && ` · ${scopeData.geo_scope.department_name}`}
              {scopeData.geo_scope?.municipality_name && ` · ${scopeData.geo_scope.municipality_name}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Stats ──────────────────────────────────────────────────── */}
      {stats && activeStats.length > 0 && (
        <div className={`grid gap-4 ${activeStats.length <= 3 ? 'grid-cols-3' : activeStats.length <= 4 ? 'grid-cols-4' : 'grid-cols-4 lg:grid-cols-8'}`}>
          {activeStats.map(({ key, label, color }) => {
            const value = stats[key as keyof GeoStats]
            const textColor = color.split(' ')[0]
            return (
              <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <p className="text-slate-500 text-xs font-medium">{label}</p>
                <p className={`text-2xl font-black mt-1 ${textColor}`}>{value.toLocaleString('es-ES')}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Section 3: Datos geográficos adicionales ──────────────────────────── */}
      <div>
        <h4 className="text-base font-bold text-slate-700 mb-4">Datos geográficos adicionales</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload */}
          <Card className="border border-slate-200 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Importar archivo</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Acepta <strong>CSV</strong>, <strong>XLSX</strong> y <strong>JSON</strong> (plano, anidado, JEOZ o Colombia)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex flex-col items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <div className="flex gap-3 text-slate-400">
                  <FileSpreadsheet className="h-7 w-7" />
                  <FileJson className="h-7 w-7" />
                </div>
                <div className="text-center">
                  {file ? (
                    <>
                      <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB · {totalRows} unidades detectadas</p>
                    </>
                  ) : pendingRows ? (
                    <>
                      <p className="text-sm font-semibold text-slate-700">Datos de Colombia listos</p>
                      <p className="text-xs text-slate-400 mt-1">{totalRows.toLocaleString('es-ES')} unidades detectadas</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-700">Haz clic o arrastra un archivo</p>
                      <p className="text-xs text-slate-400 mt-1">.csv · .xlsx · .json</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                />
              </label>

              {hasRowsReady && (
                <Button onClick={handleImport} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-md shadow-primary/20">
                  {loading ? 'Importando...' : `Importar ${totalRows.toLocaleString('es-ES')} unidades`}
                </Button>
              )}

              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 rounded-lg text-red-700 border border-red-100">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-4 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100">
                    <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Importación completada</p>
                      <p className="text-sm mt-1">
                        {result.imported.toLocaleString('es-ES')} importadas · {result.skipped.toLocaleString('es-ES')} omitidas (duplicadas)
                      </p>
                    </div>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Errores ({result.errors.length}):</p>
                      {result.errors.slice(0, 5).map((e, i) => (
                        <p key={i} className="text-xs text-amber-600">{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-4">
            {/* Colombia preset — only shown when no data loaded yet */}
            {totalUnits === 0 && (
              <Card className="border border-blue-100 bg-blue-50/30 shadow-sm rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Flag className="h-4 w-4 text-blue-500" />
                    Datos predefinidos — Colombia
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    13 ciudades principales · ~1,447 barrios · comunas, localidades, UPZ y corregimientos incluidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleLoadColombia} variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar datos de Colombia
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="border border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                  Formato CSV / XLSX
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left pb-2 font-semibold text-slate-500 uppercase tracking-wider">Columna</th>
                      <th className="text-left pb-2 font-semibold text-slate-500 uppercase tracking-wider">Req.</th>
                      <th className="text-left pb-2 font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {[
                      ['tipo',      '✅', 'departamento | municipio | localidad | upz | comuna | corregimiento | barrio | vereda'],
                      ['nombre',    '✅', 'Nombre de la unidad'],
                      ['codigo',    '—',  'Código oficial (DANE, INE…)'],
                      ['padre',     '—',  'Nombre de la unidad padre'],
                      ['poblacion', '—',  'Número de habitantes'],
                      ['geojson',   '—',  'Polígono como string JSON'],
                    ].map(([col, req, desc]) => (
                      <tr key={col} className="border-b border-slate-50 last:border-0">
                        <td className="py-1.5 font-mono text-primary">{col}</td>
                        <td className="py-1.5 text-center">{req}</td>
                        <td className="py-1.5 text-slate-500">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-slate-400" />
                  Formato JSON anidado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-slate-50 rounded-lg p-3 overflow-auto text-slate-600 border border-slate-100">{`[{
  "nombre": "Cundinamarca",
  "codigo": "25",
  "municipios": [{
    "nombre": "Bogotá",
    "barrios": ["Chapinero",
      "Usaquén"]
  }]
}]`}</pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <Card className="border border-slate-200 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-400" />
              Vista previa (primeras 10 filas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Tipo', 'Nombre', 'Código', 'Padre', 'Población'].map(h => (
                      <th key={h} className="text-left pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass(row.tipo)}`}>
                          <MapPin className="h-2.5 w-2.5" />
                          {row.tipo}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">{row.nombre}</td>
                      <td className="py-2 px-3 text-slate-400 font-mono text-xs">{row.codigo ?? '—'}</td>
                      <td className="py-2 px-3 text-slate-500">{row.padre ?? '—'}</td>
                      <td className="py-2 px-3 text-slate-400">{row.poblacion ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalRows > 10 && (
                <p className="text-xs text-slate-400 mt-3 px-3">... y {(totalRows - 10).toLocaleString('es-ES')} unidades más</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger zone */}
      {totalUnits > 0 && (
        <Card className="border border-red-100 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-red-700">Zona de peligro</CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Elimina toda la base geográfica de esta campaña. Los territorios y contactos existentes no se verán afectados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              size="sm"
              disabled={clearing}
              onClick={handleClear}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {clearing ? 'Eliminando...' : `Limpiar base geográfica (${totalUnits.toLocaleString('es-ES')} unidades)`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
