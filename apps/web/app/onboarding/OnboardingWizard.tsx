'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Check, ArrowRight, ArrowLeft, Sparkles, Rocket } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Palette {
  id:               string
  name:             string
  category:         string
  color_primary:    string
  color_secondary:  string
  color_accent:     string
  color_background: string
  color_surface:    string
}

// ── 20 preset palettes ─────────────────────────────────────────────────────────

const PALETTES: Palette[] = [
  // Clásicas
  { id: 'blue-inst',  name: 'Azul Institucional', category: 'Clásicas',
    color_primary: '#2960ec', color_secondary: '#1e293b', color_accent: '#ea580c', color_background: '#f8fafc', color_surface: '#ffffff' },
  { id: 'green-hope', name: 'Verde Esperanza',    category: 'Clásicas',
    color_primary: '#16a34a', color_secondary: '#14532d', color_accent: '#84cc16', color_background: '#f0fdf4', color_surface: '#ffffff' },
  { id: 'red-patria', name: 'Rojo Patria',        category: 'Clásicas',
    color_primary: '#dc2626', color_secondary: '#7f1d1d', color_accent: '#f97316', color_background: '#fff7f7', color_surface: '#ffffff' },
  { id: 'purple-tx',  name: 'Morado Transformación', category: 'Clásicas',
    color_primary: '#7c3aed', color_secondary: '#3b0764', color_accent: '#ec4899', color_background: '#faf5ff', color_surface: '#ffffff' },
  { id: 'orange-en',  name: 'Naranja Energía',    category: 'Clásicas',
    color_primary: '#ea580c', color_secondary: '#7c2d12', color_accent: '#fbbf24', color_background: '#fff7ed', color_surface: '#ffffff' },
  { id: 'indigo-pr',  name: 'Índigo Progreso',    category: 'Clásicas',
    color_primary: '#4338ca', color_secondary: '#1e1b4b', color_accent: '#06b6d4', color_background: '#eef2ff', color_surface: '#ffffff' },
  { id: 'teal-soc',   name: 'Teal Social',        category: 'Clásicas',
    color_primary: '#0d9488', color_secondary: '#134e4a', color_accent: '#f59e0b', color_background: '#f0fdfa', color_surface: '#ffffff' },
  // Modernas
  { id: 'sky-blue',   name: 'Azul Cielo',         category: 'Modernas',
    color_primary: '#0891b2', color_secondary: '#164e63', color_accent: '#a3e635', color_background: '#ecfeff', color_surface: '#ffffff' },
  { id: 'slate-el',   name: 'Gris Elegante',      category: 'Modernas',
    color_primary: '#475569', color_secondary: '#1e293b', color_accent: '#3b82f6', color_background: '#f8fafc', color_surface: '#ffffff' },
  { id: 'brown-ti',   name: 'Café Tierra',        category: 'Modernas',
    color_primary: '#92400e', color_secondary: '#451a03', color_accent: '#d97706', color_background: '#fdf8f0', color_surface: '#ffffff' },
  { id: 'rose-mo',    name: 'Rose Moderno',       category: 'Modernas',
    color_primary: '#e11d48', color_secondary: '#881337', color_accent: '#f97316', color_background: '#fff1f2', color_surface: '#ffffff' },
  { id: 'lime-fu',    name: 'Lima Futuro',        category: 'Modernas',
    color_primary: '#65a30d', color_secondary: '#365314', color_accent: '#0ea5e9', color_background: '#f7fee7', color_surface: '#ffffff' },
  { id: 'fuchsia-cr', name: 'Fucsia Creativo',    category: 'Modernas',
    color_primary: '#a21caf', color_secondary: '#581c87', color_accent: '#06b6d4', color_background: '#fdf4ff', color_surface: '#ffffff' },
  // Colombia regional
  { id: 'col-llanos', name: 'Verde Llanos',       category: 'Colombia',
    color_primary: '#15803d', color_secondary: '#14532d', color_accent: '#ca8a04', color_background: '#f0fdf4', color_surface: '#ffffff' },
  { id: 'col-cafe',   name: 'Rojo Cafetero',      category: 'Colombia',
    color_primary: '#b91c1c', color_secondary: '#450a0a', color_accent: '#16a34a', color_background: '#fff5f5', color_surface: '#ffffff' },
  { id: 'col-costa',  name: 'Azul Costa',         category: 'Colombia',
    color_primary: '#1d4ed8', color_secondary: '#172554', color_accent: '#fbbf24', color_background: '#eff6ff', color_surface: '#ffffff' },
  { id: 'col-sol',    name: 'Amarillo Sol',       category: 'Colombia',
    color_primary: '#ca8a04', color_secondary: '#713f12', color_accent: '#dc2626', color_background: '#fefce8', color_surface: '#ffffff' },
  { id: 'col-amazon', name: 'Verde Amazonía',     category: 'Colombia',
    color_primary: '#166534', color_secondary: '#052e16', color_accent: '#0891b2', color_background: '#f0fdf4', color_surface: '#ffffff' },
  { id: 'col-andina', name: 'Azul Andino',        category: 'Colombia',
    color_primary: '#1e40af', color_secondary: '#172554', color_accent: '#f97316', color_background: '#eff6ff', color_surface: '#ffffff' },
  { id: 'col-pacifico', name: 'Verde Pacífico',   category: 'Colombia',
    color_primary: '#065f46', color_secondary: '#022c22', color_accent: '#fbbf24', color_background: '#ecfdf5', color_surface: '#ffffff' },
]

const CATEGORIES = ['Clásicas', 'Modernas', 'Colombia']

const TOTAL_STEPS = 5

// ── Mini-sidebar preview ───────────────────────────────────────────────────────

function SidebarPreview({
  palette,
  candidateName,
  slogan,
  photoUrl,
}: {
  palette:       Palette
  candidateName: string
  slogan:        string
  photoUrl:      string | null
}) {
  return (
    <div
      className="w-56 rounded-xl border shadow-lg overflow-hidden flex flex-col text-xs"
      style={{ backgroundColor: palette.color_surface, borderColor: `${palette.color_primary}33` }}
    >
      {/* Brand header */}
      <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: `${palette.color_primary}22` }}>
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden"
            style={{ backgroundColor: palette.color_primary }}
          >
            {photoUrl
              ? <img src={photoUrl} alt="preview" width={36} height={36} className="h-9 w-9 object-cover" />
              : (candidateName?.[0] ?? 'C').toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate" style={{ color: palette.color_secondary }}>
              {candidateName || 'Tu campaña'}
            </p>
            {slogan && (
              <p className="truncate italic opacity-60" style={{ color: palette.color_secondary }}>
                "{slogan}"
              </p>
            )}
          </div>
        </div>
        {/* Color strip */}
        <div
          className="mt-2 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${palette.color_primary}, ${palette.color_primary}44)` }}
        />
      </div>
      {/* Fake nav */}
      <div className="px-2 py-2 flex flex-col gap-0.5">
        {['Dashboard', 'Contactos', 'Canvassing', 'Reportes'].map((item, i) => (
          <div
            key={item}
            className="px-2 py-1 rounded-md flex items-center gap-1.5"
            style={i === 0
              ? { backgroundColor: `${palette.color_primary}18`, color: palette.color_primary }
              : { color: '#64748b' }
            }
          >
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: i === 0 ? palette.color_primary : '#cbd5e1' }}
            />
            {item}
          </div>
        ))}
      </div>
      {/* CTA button */}
      <div className="px-2 pb-2 mt-auto">
        <div
          className="w-full py-1.5 rounded-lg text-center text-white text-[10px] font-bold"
          style={{ backgroundColor: palette.color_primary }}
        >
          Nueva Campaña
        </div>
      </div>
    </div>
  )
}

// ── Wizard ─────────────────────────────────────────────────────────────────────

interface Props {
  userFullName:          string
  defaultCandidateName:  string
}

export function OnboardingWizard({ userFullName, defaultCandidateName }: Props) {
  const router = useRouter()
  const [step,            setStep]            = useState(1)
  const [selectedPalette, setSelectedPalette] = useState<Palette>(PALETTES[0])
  const [activeCategory,  setActiveCategory]  = useState('Clásicas')
  const [candidateName,   setCandidateName]   = useState(defaultCandidateName)
  const [candidateRole,   setCandidateRole]   = useState('')
  const [slogan,          setSlogan]          = useState('')
  const [logoUrl,         setLogoUrl]         = useState<string | null>(null)
  const [photoUrl,        setPhotoUrl]        = useState<string | null>(null)
  const [uploading,       setUploading]       = useState(false)
  const [saving,          setSaving]          = useState(false)
  const logoInputRef  = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const progress = (step / TOTAL_STEPS) * 100

  async function uploadImage(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload/image', { method: 'POST', body: fd })
    if (!res.ok) return null
    const { url } = await res.json()
    return url as string
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      if (url) setLogoUrl(url)
      else toast.error('No se pudo subir el logo')
    } finally {
      setUploading(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      if (url) setPhotoUrl(url)
      else toast.error('No se pudo subir la foto')
    } finally {
      setUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function handleFinish() {
    setSaving(true)
    try {
      const res = await fetch('/api/brand/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          logo_url:           logoUrl,
          candidate_photo_url: photoUrl,
          ...selectedPalette,
          slogan:          slogan          || null,
          candidate_name:  candidateName  || null,
          candidate_role:  candidateRole  || null,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setStep(5)
    } catch {
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  // ── Step renderers ─────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="flex flex-col items-center text-center gap-6">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Bienvenido{userFullName ? `, ${userFullName.split(' ')[0]}` : ''}!
          </h1>
          <p className="mt-2 text-slate-500 max-w-md">
            Vamos a personalizar la plataforma con los colores y la identidad de tu campaña.
            Solo tomará 2 minutos.
          </p>
        </div>
        <Button size="lg" onClick={() => setStep(2)} className="gap-2">
          Comenzar <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  function renderStep2() {
    const filtered = PALETTES.filter(p => p.category === activeCategory)
    return (
      <div className="flex gap-8 w-full">
        {/* Left: palette selector */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Tu identidad visual</h2>
          <p className="text-sm text-slate-500 mb-4">Elige la paleta de colores que mejor representa tu campaña.</p>

          {/* Category tabs */}
          <div className="flex gap-2 mb-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={activeCategory === cat ? { backgroundColor: selectedPalette.color_primary } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Palette grid */}
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(palette => (
              <button
                key={palette.id}
                onClick={() => setSelectedPalette(palette)}
                className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                  selectedPalette.id === palette.id
                    ? 'shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                style={selectedPalette.id === palette.id
                  ? { borderColor: palette.color_primary }
                  : {}
                }
              >
                {/* Color swatches */}
                <div className="flex gap-1 mb-2">
                  {[palette.color_primary, palette.color_secondary, palette.color_accent].map(c => (
                    <div key={c} className="h-5 w-5 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-800">{palette.name}</p>
                {selectedPalette.id === palette.id && (
                  <div
                    className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: palette.color_primary }}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Logo upload */}
          <div className="mt-4 space-y-1.5">
            <Label className="text-sm font-medium">Logo de la organización (opcional)</Label>
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" width={40} height={40} className="h-10 w-10 rounded-lg object-cover border" />
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => logoInputRef.current?.click()}
                className="gap-1.5 text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Subiendo…' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="hidden lg:flex flex-col items-center gap-3 flex-shrink-0">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Vista previa</p>
          <SidebarPreview
            palette={selectedPalette}
            candidateName={candidateName}
            slogan={slogan}
            photoUrl={photoUrl ?? logoUrl}
          />
        </div>
      </div>
    )
  }

  function renderStep3() {
    return (
      <div className="flex gap-8 w-full">
        <div className="flex-1 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">El candidato</h2>
            <p className="text-sm text-slate-500 mt-1">Información que aparecerá en el panel lateral.</p>
          </div>

          {/* Photo upload */}
          <div className="space-y-2">
            <Label>Foto del candidato / candidata</Label>
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-full flex-shrink-0 overflow-hidden border-2 flex items-center justify-center text-white font-bold text-lg"
                style={{
                  borderColor: selectedPalette.color_primary,
                  backgroundColor: photoUrl ? 'transparent' : selectedPalette.color_primary,
                }}
              >
                {photoUrl
                  ? <img src={photoUrl} alt="Foto" width={64} height={64} className="h-16 w-16 object-cover" />
                  : (candidateName?.[0] ?? 'C').toUpperCase()
                }
              </div>
              <div>
                <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => photoInputRef.current?.click()}
                  className="gap-1.5 text-xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? 'Subiendo…' : photoUrl ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG o WebP. Máx. 5 MB</p>
              </div>
            </div>
          </div>

          {/* Candidate name */}
          <div className="space-y-1.5">
            <Label htmlFor="candidateName">Nombre del candidato / candidata</Label>
            <Input
              id="candidateName"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              placeholder="Ej: María López"
            />
          </div>

          {/* Candidate role */}
          <div className="space-y-1.5">
            <Label htmlFor="candidateRole">Cargo al que aspira</Label>
            <Input
              id="candidateRole"
              value={candidateRole}
              onChange={e => setCandidateRole(e.target.value)}
              placeholder="Ej: Candidata a la Alcaldía de Bogotá"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="hidden lg:flex flex-col items-center gap-3 flex-shrink-0">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Vista previa</p>
          <SidebarPreview
            palette={selectedPalette}
            candidateName={candidateName}
            slogan={slogan}
            photoUrl={photoUrl ?? logoUrl}
          />
        </div>
      </div>
    )
  }

  function renderStep4() {
    return (
      <div className="flex gap-8 w-full">
        <div className="flex-1 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">La campaña</h2>
            <p className="text-sm text-slate-500 mt-1">El mensaje que define tu campaña.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slogan">Eslogan de campaña</Label>
            <Input
              id="slogan"
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
              placeholder="Ej: Juntos construimos el futuro"
              maxLength={80}
            />
            <p className="text-xs text-slate-400">{slogan.length}/80 — aparece en el panel lateral del dashboard</p>
          </div>
        </div>

        {/* Preview */}
        <div className="hidden lg:flex flex-col items-center gap-3 flex-shrink-0">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Vista previa</p>
          <SidebarPreview
            palette={selectedPalette}
            candidateName={candidateName}
            slogan={slogan}
            photoUrl={photoUrl ?? logoUrl}
          />
        </div>
      </div>
    )
  }

  function renderStep5() {
    return (
      <div className="flex flex-col items-center text-center gap-6">
        <div
          className="h-20 w-20 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${selectedPalette.color_primary}18` }}
        >
          <Rocket className="h-10 w-10" style={{ color: selectedPalette.color_primary }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">¡Todo listo!</h1>
          <p className="mt-2 text-slate-500 max-w-md">
            Tu campaña está personalizada y lista para comenzar. Puedes cambiar cualquier detalle en
            <strong> Configuración → Marca e Identidad</strong>.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => router.push('/dashboard')}
          className="gap-2"
          style={{ backgroundColor: selectedPalette.color_primary }}
        >
          Ir al Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: selectedPalette.color_primary }}
        />
      </div>

      {/* Header */}
      {step < 5 && (
        <div className="px-8 py-4 flex items-center justify-between border-b bg-white">
          <span className="text-sm font-semibold text-slate-400">
            Paso {step} de {TOTAL_STEPS - 1}
          </span>
          <span className="text-xs text-slate-400">
            {['', 'Bienvenida', 'Identidad visual', 'El candidato', 'La campaña'][step]}
          </span>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className={`w-full ${step === 1 || step === 5 ? 'max-w-lg' : 'max-w-4xl'}`}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>
      </div>

      {/* Footer nav */}
      {step > 1 && step < 5 && (
        <div className="px-8 py-4 bg-white border-t flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </Button>

          {step < 4 ? (
            <Button onClick={() => setStep(s => s + 1)} className="gap-1.5">
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving} className="gap-1.5">
              {saving ? 'Guardando…' : 'Finalizar'} <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
