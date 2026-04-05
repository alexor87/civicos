'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export default function ImportContactsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function submitRows(rows: unknown[]) {
    try {
      const res = await fetch('/api/import/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const name = file.name.toLowerCase()
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls')

    const reader = new FileReader()
    reader.onload = async (e) => {
      if (isExcel) {
        try {
          const buffer = e.target?.result as ArrayBuffer
          const workbook = XLSX.read(buffer, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
          await submitRows(rows)
        } catch (err) {
          setError(`Error al parsear Excel: ${err instanceof Error ? err.message : 'desconocido'}`)
          setLoading(false)
        }
        return
      }

      const csv = e.target?.result as string
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: async (parsed) => {
          await submitRows(parsed.data as unknown[])
        },
        error: (err: Error) => {
          setError(`Error al parsear CSV: ${err.message}`)
          setLoading(false)
        },
      })
    }

    if (isExcel) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/contacts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Importar contactos</h1>
          <p className="text-slate-500 text-sm">Sube un archivo CSV o Excel para importar contactos masivamente</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formato del archivo</CardTitle>
          <CardDescription>
            Acepta CSV, XLSX y XLS. El archivo debe incluir las columnas: <code className="bg-slate-100 px-1 rounded text-xs">NOMBRE</code>, <code className="bg-slate-100 px-1 rounded text-xs">APELLIDO</code>,
            y opcionalmente: <code className="bg-slate-100 px-1 rounded text-xs">TELEFONO</code>, <code className="bg-slate-100 px-1 rounded text-xs">CORREO ELECTRONICO</code>, <code className="bg-slate-100 px-1 rounded text-xs">DIRECCION</code>, <code className="bg-slate-100 px-1 rounded text-xs">BARRIO</code>, <code className="bg-slate-100 px-1 rounded text-xs">NRO CC</code>, <code className="bg-slate-100 px-1 rounded text-xs">PUESTO DE VOTACION</code>, <code className="bg-slate-100 px-1 rounded text-xs">MESA</code>, <code className="bg-slate-100 px-1 rounded text-xs">FECHA DE NACIMIENTO</code>, <code className="bg-slate-100 px-1 rounded text-xs">REFERIDO</code>, <code className="bg-slate-100 px-1 rounded text-xs">COMUNA</code>. También acepta nombres en inglés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {file && !result && (
            <Button onClick={handleImport} disabled={loading} className="w-full">
              {loading ? 'Importando...' : `Importar ${file.name}`}
            </Button>
          )}

          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 rounded-lg text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
