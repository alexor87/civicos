'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ProfilePhotoUpload } from '@/components/perfil/ProfilePhotoUpload'
import { GeoSelector } from '@/components/perfil/GeoSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface Profile {
  full_name: string | null
  short_name: string | null
  email?: string
  phone: string | null
  custom_title: string | null
  avatar_url: string | null
  department_code: string | null
  municipality_code: string | null
  locality_name: string | null
  neighborhood_name: string | null
  language: string
  timezone: string
}

const LANGUAGES = [
  { value: 'es_CO', label: 'Español (Colombia)' },
  { value: 'es', label: 'Español (Internacional)' },
  { value: 'en', label: 'English' },
]

const TIMEZONES = [
  { value: 'America/Bogota', label: 'Colombia (GMT-5)' },
  { value: 'America/Mexico_City', label: 'México Central (GMT-6)' },
  { value: 'America/Lima', label: 'Perú (GMT-5)' },
  { value: 'America/Santiago', label: 'Chile (GMT-4)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (GMT-3)' },
  { value: 'America/New_York', label: 'US Eastern (GMT-5)' },
  { value: 'Europe/Madrid', label: 'España (GMT+1)' },
]

export default function InformacionPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userInitials, setUserInitials] = useState('?')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setUserEmail(data.email ?? '')
        setUserInitials(
          data.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
        )
        setLoading(false)
      })
      .catch(() => { toast.error('Error al cargar perfil'); setLoading(false) })
  }, [])

  const update = useCallback((field: string, value: string | null) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : prev)
    setDirty(true)
  }, [])

  const handleGeoChange = useCallback((values: Record<string, string | null>) => {
    setProfile(prev => prev ? { ...prev, ...values } : prev)
    setDirty(true)
  }, [])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al guardar')
        return
      }
      toast.success('Cambios guardados')
      setDirty(false)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
  }

  if (!profile) return null

  const selectClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Información personal</h1>
        <p className="text-sm text-slate-500 mt-1">Datos básicos de tu cuenta</p>
      </div>

      {/* Photo */}
      <ProfilePhotoUpload
        currentUrl={profile.avatar_url}
        initials={userInitials}
        onUploaded={(url) => { setProfile(prev => prev ? { ...prev, avatar_url: url } : prev) }}
      />

      {/* Name fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name">Nombre completo *</Label>
          <Input
            id="full_name"
            value={profile.full_name ?? ''}
            onChange={e => update('full_name', e.target.value)}
            placeholder="Nombre Apellido"
            maxLength={100}
          />
          <p className="text-xs text-slate-400 mt-1">Mínimo 2 palabras</p>
        </div>
        <div>
          <Label htmlFor="short_name">Nombre corto</Label>
          <Input
            id="short_name"
            value={profile.short_name ?? ''}
            onChange={e => update('short_name', e.target.value)}
            placeholder="Cómo te llaman"
            maxLength={30}
          />
        </div>
      </div>

      {/* Email (read-only) + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={userEmail}
            disabled
            className="bg-slate-50 text-slate-500"
          />
          <p className="text-xs text-slate-400 mt-1">No se puede cambiar desde aquí</p>
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={profile.phone ?? ''}
            onChange={e => update('phone', e.target.value)}
            placeholder="+573001234567"
          />
          <p className="text-xs text-slate-400 mt-1">Formato: +57...</p>
        </div>
      </div>

      {/* Custom title */}
      <div>
        <Label htmlFor="custom_title">Cargo personalizado</Label>
        <Input
          id="custom_title"
          value={profile.custom_title ?? ''}
          onChange={e => update('custom_title', e.target.value)}
          placeholder="Ej: Director de Comunicaciones"
          maxLength={100}
        />
      </div>

      {/* Geographic zone */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Zona geográfica</h3>
        <GeoSelector
          departmentCode={profile.department_code}
          municipalityCode={profile.municipality_code}
          localityName={profile.locality_name}
          neighborhoodName={profile.neighborhood_name}
          onChange={handleGeoChange}
        />
      </div>

      {/* Language + Timezone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="language">Idioma</Label>
          <select
            id="language"
            value={profile.language ?? 'es_CO'}
            onChange={e => update('language', e.target.value)}
            className={selectClass}
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="timezone">Zona horaria</Label>
          <select
            id="timezone"
            value={profile.timezone ?? 'America/Bogota'}
            onChange={e => update('timezone', e.target.value)}
            className={selectClass}
          >
            {TIMEZONES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Save button */}
      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  )
}
