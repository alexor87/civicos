'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ChevronLeft, Globe, Vote } from 'lucide-react'
import Link from 'next/link'
import { COLOMBIA_ELECTION_TYPES } from '@/lib/election-types'

const COUNTRIES = [
  { value: 'colombia',   label: '🇨🇴 Colombia',   note: 'Incluye datos geográficos (comunas, barrios, veredas)' },
  { value: 'mexico',     label: '🇲🇽 México',      note: '' },
  { value: 'argentina',  label: '🇦🇷 Argentina',   note: '' },
  { value: 'espana',     label: '🇪🇸 España',      note: '' },
  { value: 'otro',       label: '🌎 Otro país',    note: '' },
]

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    orgName: '',
    slug: '',
    fullName: '',
    email: '',
    password: '',
    campaignName: '',
    electionDate: '',
    country: 'colombia',
    electionType: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'orgName') {
        next.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear la organización')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) throw signInError

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
  }

  const selectedCountry = COUNTRIES.find(c => c.value === form.country)
  const isColombia = form.country === 'colombia'

  return (
    <AuthLayout tagline="14 días gratis, sin tarjeta de crédito">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {step === 1 ? 'Tu organización' : 'Tu primera campaña'}
            </h1>
            <span className="text-xs text-slate-400 font-medium">Paso {step} de 2</span>
          </div>
          <p className="text-slate-500 text-sm">
            {step === 1
              ? 'Crea tu cuenta de administrador'
              : 'Configura tu primera campaña electoral'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-100 rounded-full">
          <div
            className="h-1 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {step === 1 ? (
          <form onSubmit={e => { e.preventDefault(); setStep(2) }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Nombre de la organización</Label>
              <Input
                id="orgName"
                name="orgName"
                placeholder="Partido / ONG / Consultoría"
                value={form.orgName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Subdominio</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="slug"
                  name="slug"
                  placeholder="mi-org"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  className="flex-1"
                />
                <span className="text-slate-400 text-sm whitespace-nowrap">.civicos.app</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Tu nombre completo</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Juan García"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="juan@org.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Siguiente
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Country selector */}
            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                País de operación
              </Label>
              <select
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {COUNTRIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {selectedCountry?.note && (
                <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                  ✓ {selectedCountry.note}
                </p>
              )}
            </div>

            {/* Election type — Colombia only */}
            {isColombia && (
              <div className="space-y-2">
                <Label htmlFor="electionType" className="flex items-center gap-1.5">
                  <Vote className="h-3.5 w-3.5 text-slate-400" />
                  Cargo al que aspiras
                </Label>
                <select
                  id="electionType"
                  name="electionType"
                  value={form.electionType}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Selecciona un cargo...</option>
                  {COLOMBIA_ELECTION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">
                  Esto configura el ámbito geográfico de tu campaña
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="campaignName">Nombre de la campaña</Label>
              <Input
                id="campaignName"
                name="campaignName"
                placeholder="Elecciones Municipales 2026"
                value={form.campaignName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="electionDate">Fecha de elección</Label>
              <Input
                id="electionDate"
                name="electionDate"
                type="date"
                value={form.electionDate}
                onChange={handleChange}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading
                  ? isColombia
                    ? 'Configurando datos de Colombia...'
                    : 'Creando organización...'
                  : 'Crear organización'}
              </Button>
            </div>

            {isColombia && !loading && (
              <p className="text-xs text-slate-400 text-center">
                Importaremos automáticamente los datos geográficos de Colombia (~1,500 unidades)
              </p>
            )}
          </form>
        )}

        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
