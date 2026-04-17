'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PhoneInput } from './PhoneInput'
import { MunicipalitySelector } from './MunicipalitySelector'

interface RegistrationConfig {
  campaign_id: string
  slug: string
  primary_color: string
  button_text: string
  show_email: boolean
  show_document: boolean
  show_gender: boolean
  show_age_group: boolean
  show_district: boolean
  authorization_text: string | null
  privacy_policy_url: string | null
  referral_enabled: boolean
  geo_department_code: string | null
  geo_department_name: string | null
  geo_municipality_name: string | null
}

const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
const GENDERS = [
  { value: 'male', label: 'Hombre' },
  { value: 'female', label: 'Mujer' },
  { value: 'other', label: 'Prefiero no decir' },
]
const DOC_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PA', label: 'Pasaporte' },
]

export function PublicRegistrationForm({ config }: { config: RegistrationConfig }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referrerCode = searchParams.get('ref') || ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [docType, setDocType] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [department, setDepartment] = useState(config.geo_department_code || '')
  const [municipality, setMunicipality] = useState('')
  const [district, setDistrict] = useState('')
  const [gender, setGender] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = 'Requerido'
    if (!lastName.trim()) errs.lastName = 'Requerido'
    if (!phone || phone.length < 10) errs.phone = 'Ingrese un número de celular válido'
    if (!department) errs.department = 'Requerido'
    if (!municipality) errs.municipality = 'Requerido'
    if (!authorized) errs.authorized = 'Debe autorizar el tratamiento de datos'
    if (config.show_email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Correo electrónico inválido'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError('')

    try {
      const payload = {
        campaign_id: config.campaign_id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone,
        email: email || undefined,
        document_type: docType || undefined,
        document_number: docNumber || undefined,
        department,
        municipality,
        district: district || undefined,
        gender: gender || undefined,
        age_group: ageGroup || undefined,
        data_authorization: authorized,
        referrer_code: referrerCode || undefined,
        honeypot: honeypot || undefined,
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/public-contact-register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError('Ya estás registrado en esta campaña. ¡Gracias por tu apoyo!')
          return
        }
        if (res.status === 429) {
          setError('Demasiados registros. Intenta más tarde.')
          return
        }
        setError(data.error || 'Error al registrarse. Intente de nuevo.')
        return
      }

      // Success — redirect to confirmation
      const params = new URLSearchParams({ code: data.referral_code })
      if (data.is_existing) params.set('existing', '1')
      router.push(`/${config.slug}/confirmacion?${params.toString()}`)
    } catch {
      setError('Error de conexión. Verifique su internet e intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const defaultAuthText = `Autorizo el tratamiento de mis datos personales de acuerdo con la Ley 1581 de 2012, con la finalidad de ser contactado(a) para actividades relacionadas con esta campaña política.`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — hidden from users */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* Names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nombres <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
              errors.firstName ? 'border-red-400' : 'border-slate-300'
            }`}
            placeholder="Tu nombre"
          />
          {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Apellidos <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
              errors.lastName ? 'border-red-400' : 'border-slate-300'
            }`}
            placeholder="Tu apellido"
          />
          {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
        </div>
      </div>

      {/* Phone */}
      <PhoneInput
        value={phone}
        onChange={setPhone}
        error={errors.phone}
        required
      />

      {/* Document (optional) */}
      {config.show_document && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo de identificación
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Seleccione...</option>
              {DOC_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Número de identificación
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Número de documento"
            />
          </div>
        </div>
      )}

      {/* Email (optional) */}
      {config.show_email && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
              errors.email ? 'border-red-400' : 'border-slate-300'
            }`}
            placeholder="correo@ejemplo.com"
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
        </div>
      )}

      {/* Department / Municipality */}
      <MunicipalitySelector
        department={department}
        municipality={municipality}
        onDepartmentChange={setDepartment}
        onMunicipalityChange={setMunicipality}
        errors={{ department: errors.department, municipality: errors.municipality }}
        fixedDepartmentCode={config.geo_department_code || undefined}
        fixedMunicipalityName={config.geo_municipality_name || undefined}
      />

      {/* District (optional) */}
      {config.show_district && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Barrio / Sector
          </label>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Nombre del barrio o sector"
          />
        </div>
      )}

      {/* Gender (optional) */}
      {config.show_gender && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Género</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Seleccione...</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Age group (optional) */}
      {config.show_age_group && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Grupo de edad</label>
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Seleccione...</option>
            {AGE_GROUPS.map((ag) => (
              <option key={ag} value={ag}>{ag} años</option>
            ))}
          </select>
        </div>
      )}

      {/* Data authorization */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={authorized}
            onChange={(e) => setAuthorized(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600 leading-relaxed">
            {config.authorization_text || defaultAuthText}
          </span>
        </label>
        {config.privacy_policy_url && (
          <a
            href={config.privacy_policy_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline mt-2 inline-block ml-7"
          >
            Ver política de privacidad
          </a>
        )}
        {errors.authorized && (
          <p className="text-sm text-red-500 mt-2 ml-7">{errors.authorized}</p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: config.primary_color }}
      >
        {loading ? 'Registrando...' : config.button_text}
      </button>

      {referrerCode && (
        <p className="text-center text-xs text-slate-400">
          Referido por un simpatizante
        </p>
      )}
    </form>
  )
}
