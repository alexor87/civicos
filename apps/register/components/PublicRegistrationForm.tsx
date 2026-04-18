'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield } from 'lucide-react'
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

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-3 text-sm border rounded-xl bg-white outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
    hasError ? 'border-red-400 animate-shake' : 'border-slate-200 hover:border-slate-300'
  }`

const selectClass = (hasError: boolean) =>
  `w-full px-4 py-3 text-sm border rounded-xl bg-white outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
    hasError ? 'border-red-400 animate-shake' : 'border-slate-200 hover:border-slate-300'
  }`

export function PublicRegistrationForm({ config }: { config: RegistrationConfig }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referrerCode = searchParams.get('ref') || ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const hasExtraFields = config.show_document || config.show_gender || config.show_age_group

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
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {/* ── Section: Personal info ───────────────────────── */}
      <div className="space-y-3 animate-fade-in-up-delay-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tus datos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass(!!errors.firstName)} placeholder="Nombres *" />
            {errors.firstName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.firstName}</p>}
          </div>
          <div>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass(!!errors.lastName)} placeholder="Apellidos *" />
            {errors.lastName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.lastName}</p>}
          </div>
        </div>

        <PhoneInput value={phone} onChange={setPhone} error={errors.phone} required />

        {config.show_email && (
          <div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass(!!errors.email)} placeholder="Correo electrónico" />
            {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>}
          </div>
        )}
      </div>

      {/* ── Section: Location ────────────────────────────── */}
      <div className="space-y-3 animate-fade-in-up-delay-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">¿De dónde eres?</p>
        <MunicipalitySelector
          department={department}
          municipality={municipality}
          onDepartmentChange={setDepartment}
          onMunicipalityChange={setMunicipality}
          errors={{ department: errors.department, municipality: errors.municipality }}
          fixedDepartmentCode={config.geo_department_code || undefined}
          fixedMunicipalityName={config.geo_municipality_name || undefined}
        />
        {config.show_district && (
          <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass(false)} placeholder="Barrio o sector" />
        )}
      </div>

      {/* ── Section: Extra info ──────────────────────────── */}
      {hasExtraFields && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Un poco más sobre ti</p>
          {config.show_document && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className={selectClass(false)}>
                <option value="">Tipo de identificación</option>
                {DOC_TYPES.map((dt) => (<option key={dt.value} value={dt.value}>{dt.label}</option>))}
              </select>
              <input type="text" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className={inputClass(false)} placeholder="Número de documento" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.show_gender && (
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass(false)}>
                <option value="">Género</option>
                {GENDERS.map((g) => (<option key={g.value} value={g.value}>{g.label}</option>))}
              </select>
            )}
            {config.show_age_group && (
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className={selectClass(false)}>
                <option value="">Grupo de edad</option>
                {AGE_GROUPS.map((ag) => (<option key={ag} value={ag}>{ag} años</option>))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* ── Authorization ────────────────────────────────── */}
      <div className="space-y-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0" />
          <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors">
            {config.authorization_text || defaultAuthText}
          </span>
        </label>
        {config.privacy_policy_url && (
          <a href={config.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline ml-7">
            Ver política de privacidad
          </a>
        )}
        {errors.authorized && <p className="text-xs text-red-500 ml-7">{errors.authorized}</p>}
      </div>

      {/* ── Error ────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 animate-shake">
          {error}
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────── */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
        style={{ backgroundColor: config.primary_color }}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Registrando...
          </span>
        ) : config.button_text}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <Shield className="w-3 h-3" />
        Tu información está protegida
      </p>

      {referrerCode && (
        <p className="text-center text-xs text-slate-400">
          Referido por un simpatizante
        </p>
      )}
    </form>
  )
}
