'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X } from 'lucide-react'

interface Props {
  initial: {
    logo_url?:            string | null
    candidate_photo_url?: string | null
    candidate_name?:      string | null
    candidate_role?:      string | null
    slogan?:              string | null
  }
}

export function BrandIdentityForm({ initial }: Props) {
  const [logoUrl,       setLogoUrl]       = useState(initial.logo_url ?? '')
  const [photoUrl,      setPhotoUrl]      = useState(initial.candidate_photo_url ?? '')
  const [candidateName, setCandidateName] = useState(initial.candidate_name ?? '')
  const [candidateRole, setCandidateRole] = useState(initial.candidate_role ?? '')
  const [slogan,        setSlogan]        = useState(initial.slogan ?? '')
  const [uploading,     setUploading]     = useState(false)
  const [saving,        setSaving]        = useState(false)

  const logoInputRef  = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

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
      if (url) { setLogoUrl(url); toast.success('Logo actualizado') }
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
      if (url) { setPhotoUrl(url); toast.success('Foto actualizada') }
      else toast.error('No se pudo subir la foto')
    } finally {
      setUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/settings/brand', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        logo_url:            logoUrl            || null,
        candidate_photo_url: photoUrl           || null,
        candidate_name:      candidateName      || null,
        candidate_role:      candidateRole      || null,
        slogan:              slogan             || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Identidad guardada correctamente')
    } else {
      toast.error('Error al guardar')
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">

      {/* Logo de la organización */}
      <div className="space-y-1.5">
        <Label>Logo de la organización</Label>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
            {logoUrl
              ? <Image src={logoUrl} alt="Logo" width={56} height={56} className="h-14 w-14 object-cover" />
              : <span className="text-slate-400 text-xs text-center leading-tight px-1">Sin logo</span>
            }
          </div>
          <div className="flex flex-col gap-2">
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => logoInputRef.current?.click()} className="text-xs gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? 'Subiendo…' : 'Subir logo'}
            </Button>
            {logoUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl('')} className="text-xs text-red-500 hover:text-red-600 gap-1">
                <X className="h-3.5 w-3.5" /> Quitar logo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Foto del candidato */}
      <div className="space-y-1.5">
        <Label>Foto del candidato / candidata</Label>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center flex-shrink-0">
            {photoUrl
              ? <Image src={photoUrl} alt="Foto" width={64} height={64} className="h-16 w-16 object-cover" />
              : <span className="text-slate-400 text-xs text-center leading-tight px-1">Sin foto</span>
            }
          </div>
          <div className="flex flex-col gap-2">
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => photoInputRef.current?.click()} className="text-xs gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? 'Subiendo…' : 'Subir foto'}
            </Button>
            {photoUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setPhotoUrl('')} className="text-xs text-red-500 hover:text-red-600 gap-1">
                <X className="h-3.5 w-3.5" /> Quitar foto
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Máx. 5 MB — JPG, PNG o WebP. Aparece en el panel lateral.</p>
      </div>

      {/* Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="candidateName">Nombre del candidato / candidata</Label>
        <Input
          id="candidateName"
          value={candidateName}
          onChange={e => setCandidateName(e.target.value)}
          placeholder="Ej: María López"
        />
      </div>

      {/* Rol */}
      <div className="space-y-1.5">
        <Label htmlFor="candidateRole">Cargo al que aspira</Label>
        <Input
          id="candidateRole"
          value={candidateRole}
          onChange={e => setCandidateRole(e.target.value)}
          placeholder="Ej: Candidata a la Alcaldía"
        />
      </div>

      {/* Eslogan */}
      <div className="space-y-1.5">
        <Label htmlFor="slogan">Eslogan de campaña</Label>
        <Input
          id="slogan"
          value={slogan}
          onChange={e => setSlogan(e.target.value)}
          placeholder="Ej: Juntos construimos el futuro"
          maxLength={80}
        />
        <p className="text-xs text-muted-foreground">Aparece en el panel lateral del dashboard.</p>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar identidad'}
      </Button>
    </form>
  )
}
