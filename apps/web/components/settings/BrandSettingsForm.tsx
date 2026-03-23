'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Check } from 'lucide-react'
import { BRAND_PALETTES } from '@/components/settings/BrandColorsForm'

// ── Mini sidebar preview (same as onboarding wizard) ──────────────────────────

function SidebarPreview({
  primary,
  candidateName,
  slogan,
  photoUrl,
}: {
  primary:       string
  candidateName: string
  slogan:        string
  photoUrl:      string | null
}) {
  return (
    <div
      className="w-52 rounded-xl border shadow-lg overflow-hidden flex flex-col text-xs select-none"
      style={{ backgroundColor: '#ffffff', borderColor: `${primary}33` }}
    >
      {/* Brand header */}
      <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: `${primary}22` }}>
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden"
            style={{ backgroundColor: primary }}
          >
            {photoUrl
              ? <img src={photoUrl} alt="preview" width={36} height={36} className="h-9 w-9 object-cover" />
              : (candidateName?.[0] ?? 'C').toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate text-slate-900 leading-tight">
              {candidateName || 'Tu campaña'}
            </p>
            {slogan && (
              <p className="truncate italic text-slate-500 text-[10px] mt-0.5">"{slogan}"</p>
            )}
          </div>
        </div>
        <div
          className="mt-2 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${primary}, ${primary}44)` }}
        />
      </div>
      {/* Fake nav */}
      <div className="px-2 py-2 flex flex-col gap-0.5">
        {['Dashboard', 'Contactos', 'Canvassing', 'Reportes'].map((item, i) => (
          <div
            key={item}
            className="px-2 py-1 rounded-md flex items-center gap-1.5"
            style={i === 0
              ? { backgroundColor: `${primary}18`, color: primary }
              : { color: '#64748b' }
            }
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: i === 0 ? primary : '#cbd5e1' }} />
            {item}
          </div>
        ))}
      </div>
      {/* CTA button */}
      <div className="px-2 pb-2 mt-auto">
        <div
          className="w-full py-1.5 rounded-lg text-center text-white text-[10px] font-bold"
          style={{ backgroundColor: primary }}
        >
          Nueva Campaña
        </div>
      </div>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface InitialBrand {
  logo_url?:            string | null
  candidate_photo_url?: string | null
  candidate_name?:      string | null
  candidate_role?:      string | null
  slogan?:              string | null
  color_primary?:       string | null
  color_secondary?:     string | null
  color_accent?:        string | null
  color_background?:    string | null
  color_surface?:       string | null
}

interface Props {
  initial: InitialBrand
}

const CATEGORIES = ['Clásicas', 'Modernas', 'Colombia']

// ── Component ─────────────────────────────────────────────────────────────────

export function BrandSettingsForm({ initial }: Props) {
  const [logoUrl,         setLogoUrl]         = useState(initial.logo_url            ?? '')
  const [photoUrl,        setPhotoUrl]        = useState(initial.candidate_photo_url ?? '')
  const [candidateName,   setCandidateName]   = useState(initial.candidate_name      ?? '')
  const [candidateRole,   setCandidateRole]   = useState(initial.candidate_role      ?? '')
  const [slogan,          setSlogan]          = useState(initial.slogan              ?? '')
  const [activeCategory,  setActiveCategory]  = useState('Clásicas')
  const [selectedPalette, setSelectedPalette] = useState(
    BRAND_PALETTES.find(p => p.color_primary === (initial.color_primary ?? '#2960ec')) ?? null
  )
  const [customPrimary,   setCustomPrimary]   = useState(initial.color_primary ?? '#2960ec')
  const [uploading,       setUploading]       = useState(false)
  const [saving,          setSaving]          = useState(false)

  const logoInputRef  = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const effectivePrimary = selectedPalette?.color_primary ?? customPrimary

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
    const url = await uploadImage(file)
    setUploading(false)
    if (url) { setLogoUrl(url); toast.success('Logo actualizado') }
    else toast.error('No se pudo subir el logo')
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadImage(file)
    setUploading(false)
    if (url) { setPhotoUrl(url); toast.success('Foto actualizada') }
    else toast.error('No se pudo subir la foto')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const colorPayload = selectedPalette
      ? {
          color_primary:    selectedPalette.color_primary,
          color_secondary:  selectedPalette.color_secondary,
          color_accent:     selectedPalette.color_accent,
          color_background: selectedPalette.color_background,
          color_surface:    selectedPalette.color_surface,
        }
      : {
          color_primary:    customPrimary,
          color_secondary:  initial.color_secondary  ?? '#1e293b',
          color_accent:     initial.color_accent      ?? '#ea580c',
          color_background: initial.color_background  ?? '#f8fafc',
          color_surface:    initial.color_surface     ?? '#ffffff',
        }

    const res = await fetch('/api/settings/brand', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        logo_url:            logoUrl   || null,
        candidate_photo_url: photoUrl  || null,
        candidate_name:      candidateName  || null,
        candidate_role:      candidateRole  || null,
        slogan:              slogan         || null,
        ...colorPayload,
      }),
    })

    setSaving(false)
    if (res.ok) {
      // Apply colors immediately to the live page without needing a reload
      const el = document.documentElement
      el.style.setProperty('--color-primary',    colorPayload.color_primary)
      el.style.setProperty('--color-secondary',  colorPayload.color_secondary)
      el.style.setProperty('--color-accent',     colorPayload.color_accent)
      el.style.setProperty('--color-background', colorPayload.color_background)
      el.style.setProperty('--color-surface',    colorPayload.color_surface)
      el.style.setProperty('--primary',          colorPayload.color_primary)
      toast.success('Marca e identidad guardadas')
    } else {
      toast.error('Error al guardar')
    }
  }

  const filteredPalettes = BRAND_PALETTES.filter(p => p.category === activeCategory)

  return (
    <form onSubmit={handleSave} className="flex gap-10">

      {/* ── Left: form ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-8 max-w-xl">

        {/* Section: Imágenes */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Imágenes</h3>

          {/* Foto candidato + Logo — side by side */}
          <div className="flex gap-6">
            {/* Candidate photo */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-20 w-20 rounded-full overflow-hidden border-2 bg-slate-100 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: `${effectivePrimary}55` }}
              >
                {photoUrl
                  ? <img src={photoUrl} alt="Foto" width={80} height={80} className="h-20 w-20 object-cover" />
                  : <span className="text-slate-400 text-xs text-center leading-tight px-2">Sin foto</span>
                }
              </div>
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => photoInputRef.current?.click()} className="text-xs gap-1.5">
                <Upload className="h-3 w-3" />
                {uploading ? 'Subiendo…' : 'Foto candidato'}
              </Button>
              {photoUrl && (
                <button type="button" onClick={() => setPhotoUrl('')} className="text-[11px] text-red-400 hover:text-red-600 flex items-center gap-0.5">
                  <X className="h-3 w-3" /> Quitar
                </button>
              )}
              <p className="text-[11px] text-slate-400 text-center leading-tight">Circular · Panel lateral</p>
            </div>

            {/* Divider */}
            <div className="w-px bg-slate-100 self-stretch" />

            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" width={80} height={80} className="h-20 w-20 object-cover" />
                  : <span className="text-slate-400 text-xs text-center leading-tight px-2">Sin logo</span>
                }
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => logoInputRef.current?.click()} className="text-xs gap-1.5">
                <Upload className="h-3 w-3" />
                {uploading ? 'Subiendo…' : 'Logo organización'}
              </Button>
              {logoUrl && (
                <button type="button" onClick={() => setLogoUrl('')} className="text-[11px] text-red-400 hover:text-red-600 flex items-center gap-0.5">
                  <X className="h-3 w-3" /> Quitar
                </button>
              )}
              <p className="text-[11px] text-slate-400 text-center leading-tight">Cuadrado · Opcional</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG o WebP · Máx. 5 MB</p>
        </section>

        <div className="border-t border-slate-100" />

        {/* Section: Candidato/a */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Candidato/a</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="candidateName">Nombre</Label>
              <Input
                id="candidateName"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                placeholder="Ej: María López"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="candidateRole">Cargo al que aspira</Label>
              <Input
                id="candidateRole"
                value={candidateRole}
                onChange={e => setCandidateRole(e.target.value)}
                placeholder="Ej: Alcaldía de Bogotá"
              />
            </div>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        {/* Section: Mensaje */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Mensaje</h3>

          <div className="space-y-1.5">
            <Label htmlFor="slogan">Eslogan de campaña</Label>
            <Input
              id="slogan"
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
              placeholder="Ej: Juntos construimos el futuro"
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">{slogan.length}/80 — aparece en el panel lateral</p>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        {/* Section: Colores */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Paleta de colores</h3>

          {/* Category tabs */}
          <div className="flex gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={activeCategory === cat
                  ? { backgroundColor: effectivePrimary, color: '#fff' }
                  : { backgroundColor: '#f1f5f9', color: '#475569' }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Palette grid */}
          <div className="grid grid-cols-4 gap-2">
            {filteredPalettes.map(palette => (
              <button
                key={palette.id}
                type="button"
                onClick={() => { setSelectedPalette(palette); setCustomPrimary(palette.color_primary) }}
                className="relative p-2.5 rounded-xl border-2 text-left transition-all"
                style={selectedPalette?.id === palette.id
                  ? { borderColor: palette.color_primary }
                  : { borderColor: '#e2e8f0' }
                }
              >
                <div className="flex gap-1 mb-1.5">
                  {[palette.color_primary, palette.color_secondary, palette.color_accent].map(c => (
                    <div key={c} className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-[10px] font-semibold text-slate-700 leading-tight">{palette.name}</p>
                {selectedPalette?.id === palette.id && (
                  <div
                    className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: palette.color_primary }}
                  >
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom picker */}
          <div className="flex items-center gap-3">
            <label className="h-8 w-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden relative flex-shrink-0">
              <input
                type="color"
                value={customPrimary}
                onChange={e => { setCustomPrimary(e.target.value); setSelectedPalette(null) }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <div className="h-5 w-5 rounded-full" style={{ backgroundColor: customPrimary }} />
            </label>
            <span className="text-sm font-mono text-slate-500">{effectivePrimary}</span>
            <span className="text-xs text-slate-400">Color personalizado</span>
          </div>
        </section>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Guardando…' : 'Guardar marca e identidad'}
        </Button>
      </div>

      {/* ── Right: live preview ─────────────────────────────────────────────── */}
      <div className="hidden xl:flex flex-col items-center gap-3 pt-1 flex-shrink-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Vista previa</p>
        <div className="sticky top-6">
          <SidebarPreview
            primary={effectivePrimary}
            candidateName={candidateName}
            slogan={slogan}
            photoUrl={photoUrl || logoUrl || null}
          />
          <p className="text-[11px] text-slate-400 text-center mt-2">Actualiza en tiempo real</p>
        </div>
      </div>

    </form>
  )
}
