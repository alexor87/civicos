'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Globe, Eye, Users, Shield, Bell, Palette, MapPin } from 'lucide-react'

interface FormData {
  campaign_id: string
  is_active: boolean
  slug: string
  logo_url: string | null
  video_url: string | null
  header_image_url: string | null
  title: string
  welcome_text: string
  primary_color: string
  button_text: string
  show_email: boolean
  show_document: boolean
  show_gender: boolean
  show_age_group: boolean
  show_district: boolean
  referral_enabled: boolean
  level_names: string[]
  level_thresholds: number[]
  whatsapp_share_message: string
  authorization_text: string
  privacy_policy_url: string
  notify_new_registration: boolean
  geo_department_code: string
  geo_department_name: string
  geo_municipality_name: string
}

interface GeoEntry {
  municipio_codigo: string
  municipio_nombre: string
  departamento_codigo: string
}

const DEPARTMENTS: Record<string, string> = {
  '05': 'Antioquia', '08': 'Atlántico', '11': 'Bogotá D.C.',
  '13': 'Bolívar', '15': 'Boyacá', '17': 'Caldas',
  '18': 'Caquetá', '19': 'Cauca', '20': 'Cesar',
  '23': 'Córdoba', '25': 'Cundinamarca', '27': 'Chocó',
  '41': 'Huila', '44': 'La Guajira', '47': 'Magdalena',
  '50': 'Meta', '52': 'Nariño', '54': 'Norte de Santander',
  '63': 'Quindío', '66': 'Risaralda', '68': 'Santander',
  '70': 'Sucre', '73': 'Tolima', '76': 'Valle del Cauca',
  '81': 'Arauca', '85': 'Casanare', '86': 'Putumayo',
  '88': 'Archipiélago de San Andrés', '91': 'Amazonas',
  '94': 'Guainía', '95': 'Guaviare', '97': 'Vaupés', '99': 'Vichada',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

export function PublicRegistrationSettingsForm({
  initial,
  campaignName,
  isNew,
}: {
  initial: FormData
  campaignName: string
}) {
  const [form, setForm] = useState<FormData>(initial)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const suggestSlug = () => {
    if (!form.slug && campaignName) {
      update('slug', slugify(campaignName))
    }
  }

  const handleSave = async () => {
    if (!form.slug.trim()) {
      toast.error('El slug de la URL es requerido')
      return
    }

    setSaving(true)

    const payload = {
      campaign_id: form.campaign_id,
      is_active: form.is_active,
      slug: form.slug.trim(),
      logo_url: form.logo_url,
      video_url: form.video_url,
      header_image_url: form.header_image_url,
      title: form.title || null,
      welcome_text: form.welcome_text || null,
      primary_color: form.primary_color,
      button_text: form.button_text,
      show_email: form.show_email,
      show_document: form.show_document,
      show_gender: form.show_gender,
      show_age_group: form.show_age_group,
      show_district: form.show_district,
      referral_enabled: form.referral_enabled,
      level_names: form.level_names,
      level_thresholds: form.level_thresholds,
      whatsapp_share_message: form.whatsapp_share_message || null,
      authorization_text: form.authorization_text || null,
      privacy_policy_url: form.privacy_policy_url || null,
      notify_new_registration: form.notify_new_registration,
      geo_department_code: form.geo_department_code || null,
      geo_department_name: form.geo_department_name || null,
      geo_municipality_name: form.geo_municipality_name || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('public_registration_config')
      .upsert(payload, { onConflict: 'campaign_id' })

    setSaving(false)

    if (error) {
      if (error.code === '23505' && error.message?.includes('slug')) {
        toast.error('Este slug ya está en uso. Elige otro.')
      } else {
        toast.error('Error al guardar: ' + error.message)
      }
      return
    }

    toast.success('Configuración guardada')
  }

  // Geo data for department/municipality selectors
  const [geoData, setGeoData] = useState<GeoEntry[]>([])
  useEffect(() => {
    fetch('/geo/municipios.json')
      .then((res) => res.json())
      .then(setGeoData)
      .catch(() => {})
  }, [])

  const sortedDepts = useMemo(
    () => Object.entries(DEPARTMENTS).sort(([, a], [, b]) => a.localeCompare(b)),
    []
  )

  const geoMunicipalities = useMemo(() => {
    if (!form.geo_department_code || !geoData.length) return []
    return geoData
      .filter((g) => g.departamento_codigo === form.geo_department_code)
      .sort((a, b) => a.municipio_nombre.localeCompare(b.municipio_nombre))
  }, [form.geo_department_code, geoData])

  const handleGeoDeptChange = (code: string) => {
    const name = DEPARTMENTS[code] || ''
    update('geo_department_code', code)
    update('geo_department_name', name)
    update('geo_municipality_name', '')
  }

  const embedUrl = toEmbedUrl(form.video_url || '')
  const publicUrl = form.slug ? `unete.scrutix.co/${form.slug}` : ''

  return (
    <div className="max-w-2xl space-y-8">
      {/* ── Activación ───────────────────────────────────────────────── */}
      <Section icon={<Globe className="w-5 h-5" />} title="Activación">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Página pública activa</p>
            <p className="text-xs text-slate-500">
              {form.is_active
                ? `Accesible en ${publicUrl}`
                : 'La página no es visible públicamente'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => update('is_active', !form.is_active)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              form.is_active ? 'bg-[#2262ec]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                form.is_active ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Slug de la URL
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">unete.scrutix.co/</span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              onFocus={suggestSlug}
              placeholder="mi-campana"
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec] focus:ring-2 focus:ring-[#2262ec]/20"
            />
          </div>
        </div>
      </Section>

      {/* ── Apariencia ───────────────────────────────────────────────── */}
      <Section icon={<Palette className="w-5 h-5" />} title="Apariencia">
        <div className="space-y-4">
          <Field label="Título de la página">
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="¡Únete a nuestra causa!"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec] focus:ring-2 focus:ring-[#2262ec]/20"
            />
          </Field>

          <Field label="Texto de bienvenida">
            <textarea
              value={form.welcome_text}
              onChange={(e) => update('welcome_text', e.target.value)}
              rows={2}
              placeholder="Tu voz es importante. Regístrate como simpatizante."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec] focus:ring-2 focus:ring-[#2262ec]/20 resize-none"
            />
          </Field>

          <Field label="Color primario">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => update('primary_color', e.target.value)}
                className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={form.primary_color}
                onChange={(e) => update('primary_color', e.target.value)}
                className="w-28 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec]"
              />
            </div>
          </Field>

          <Field label="URL del video (YouTube o Vimeo)">
            <input
              type="url"
              value={form.video_url || ''}
              onChange={(e) => update('video_url', e.target.value || null)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec] focus:ring-2 focus:ring-[#2262ec]/20"
            />
            {embedUrl && (
              <div className="mt-2 aspect-video rounded-lg overflow-hidden border border-slate-200">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </Field>

          <Field label="Texto del botón">
            <input
              type="text"
              value={form.button_text}
              onChange={(e) => update('button_text', e.target.value)}
              placeholder="Unirme"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec] focus:ring-2 focus:ring-[#2262ec]/20"
            />
          </Field>
        </div>
      </Section>

      {/* ── Campos del formulario ────────────────────────────────────── */}
      <Section icon={<Eye className="w-5 h-5" />} title="Campos del formulario">
        <p className="text-xs text-slate-500 mb-3">
          Nombres, celular, departamento y municipio siempre se muestran. Activa campos adicionales:
        </p>
        <div className="space-y-3">
          <Toggle
            label="Correo electrónico"
            checked={form.show_email}
            onChange={(v) => update('show_email', v)}
          />
          <Toggle
            label="Documento de identidad"
            description="Si el ciudadano ingresa documento, se clasifica como contacto completo"
            checked={form.show_document}
            onChange={(v) => update('show_document', v)}
          />
          <Toggle
            label="Género"
            checked={form.show_gender}
            onChange={(v) => update('show_gender', v)}
          />
          <Toggle
            label="Grupo de edad"
            checked={form.show_age_group}
            onChange={(v) => update('show_age_group', v)}
          />
          <Toggle
            label="Barrio / Sector"
            checked={form.show_district}
            onChange={(v) => update('show_district', v)}
          />
        </div>
      </Section>

      {/* ── Alcance Geográfico ─────────────────────────────────────────── */}
      <Section icon={<MapPin className="w-5 h-5" />} title="Alcance Geográfico">
        <p className="text-xs text-slate-500 mb-3">
          Restringe el formulario a tu zona geográfica. Si no seleccionas nada, el ciudadano podrá elegir cualquier departamento y municipio.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Departamento">
            <select
              value={form.geo_department_code}
              onChange={(e) => handleGeoDeptChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:border-[#2262ec] focus:ring-2 focus:ring-[#2262ec]/20"
            >
              <option value="">Todos los departamentos</option>
              {sortedDepts.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </Field>
          <Field label="Municipio">
            <select
              value={form.geo_municipality_name}
              onChange={(e) => update('geo_municipality_name', e.target.value)}
              disabled={!form.geo_department_code}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:border-[#2262ec] focus:ring-2 focus:ring-[#2262ec]/20 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Todos los municipios</option>
              {geoMunicipalities.map((m) => (
                <option key={m.municipio_codigo} value={m.municipio_nombre}>{m.municipio_nombre}</option>
              ))}
            </select>
          </Field>
        </div>
        {form.geo_department_code && (
          <p className="text-xs text-slate-500 mt-3">
            {form.geo_municipality_name
              ? `El formulario mostrará solo ${form.geo_municipality_name}, ${form.geo_department_name} (campos bloqueados).`
              : `El formulario mostrará solo municipios de ${form.geo_department_name} (departamento bloqueado).`}
          </p>
        )}
      </Section>

      {/* ── Sistema de referidos ──────────────────────────────────────── */}
      <Section icon={<Users className="w-5 h-5" />} title="Sistema de Referidos">
        <Toggle
          label="Activar sistema de referidos"
          description="Cada persona que se registre recibirá un link personal para invitar a otros"
          checked={form.referral_enabled}
          onChange={(v) => update('referral_enabled', v)}
        />

        {form.referral_enabled && (
          <div className="mt-4 space-y-4">
            <Field label="Mensaje de WhatsApp al compartir">
              <textarea
                value={form.whatsapp_share_message}
                onChange={(e) => update('whatsapp_share_message', e.target.value)}
                rows={3}
                placeholder="¡Únete a nuestra causa! Regístrate aquí: {link}"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec] focus:ring-2 focus:ring-[#2262ec]/20 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">Usa <code className="bg-slate-100 px-1 rounded">{'{link}'}</code> donde quieras que aparezca el enlace de registro. Si no lo incluyes, se añadirá al final del mensaje automáticamente.</p>
            </Field>

            <p className="text-sm font-medium text-slate-700">Niveles de gamificación</p>
            {form.level_names.map((name, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-14">Nivel {i + 1}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const names = [...form.level_names]
                    names[i] = e.target.value
                    update('level_names', names)
                  }}
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec]"
                />
                <input
                  type="number"
                  value={form.level_thresholds[i]}
                  onChange={(e) => {
                    const thresholds = [...form.level_thresholds]
                    thresholds[i] = parseInt(e.target.value) || 0
                    update('level_thresholds', thresholds)
                  }}
                  min={0}
                  className="w-20 px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec] text-center"
                />
                <span className="text-xs text-slate-400">ref.</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Legal ────────────────────────────────────────────────────── */}
      <Section icon={<Shield className="w-5 h-5" />} title="Legal y Privacidad">
        <Field label="Texto de autorización de datos (Ley 1581)">
          <textarea
            value={form.authorization_text}
            onChange={(e) => update('authorization_text', e.target.value)}
            rows={3}
            placeholder="Autorizo el tratamiento de mis datos personales de acuerdo con la Ley 1581 de 2012..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec] focus:ring-2 focus:ring-[#2262ec]/20 resize-none"
          />
        </Field>

        <Field label="URL de la política de privacidad">
          <input
            type="url"
            value={form.privacy_policy_url}
            onChange={(e) => update('privacy_policy_url', e.target.value)}
            placeholder="https://mi-campaña.com/privacidad"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2262ec] focus:ring-2 focus:ring-[#2262ec]/20"
          />
        </Field>
      </Section>

      {/* ── Notificaciones ───────────────────────────────────────────── */}
      <Section icon={<Bell className="w-5 h-5" />} title="Notificaciones">
        <Toggle
          label="Notificar nuevos registros"
          description="Recibe una notificación cada vez que alguien se registra desde la página pública"
          checked={form.notify_new_registration}
          onChange={(v) => update('notify_new_registration', v)}
        />
      </Section>

      {/* ── Save ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#2262ec] text-white text-sm font-medium rounded-lg hover:bg-[#1a51d0] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

/* ── Helper Components ──────────────────────────────────────────────── */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-slate-400">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#2262ec]' : 'bg-slate-300'
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
