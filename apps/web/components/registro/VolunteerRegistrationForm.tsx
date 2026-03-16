'use client'

import { useState } from 'react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { registerVolunteer, type RegisterVolunteerInput } from '@/app/registro/[id]/actions'

const AVAILABILITY_OPTIONS = [
  { value: 'mañanas',        label: 'Mañanas' },
  { value: 'tardes',         label: 'Tardes' },
  { value: 'noches',         label: 'Noches' },
  { value: 'fines_semana',   label: 'Fines de semana' },
]

const HOW_OPTIONS = [
  'Redes sociales',
  'Un amigo o familiar',
  'Evento de campaña',
  'Correo electrónico',
  'Volante / material impreso',
  'Otro',
]

interface Props {
  campaignId:  string
  brandColor:  string
}

export function VolunteerRegistrationForm({ campaignId, brandColor }: Props) {
  const [firstName,     setFirstName]     = useState('')
  const [lastName,      setLastName]      = useState('')
  const [email,         setEmail]         = useState('')
  const [phone,         setPhone]         = useState('')
  const [city,          setCity]          = useState('')
  const [availability,  setAvailability]  = useState<string[]>([])
  const [howDidYouHear, setHowDidYouHear] = useState('')
  const [loading,       setLoading]       = useState(false)
  const [result,        setResult]        = useState<'success' | 'duplicate' | null>(null)
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null)

  const toggleAvailability = (val: string) => {
    setAvailability(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    const payload: RegisterVolunteerInput = {
      campaignId,
      firstName,
      lastName,
      email,
      phone,
      city,
      availability,
      howDidYouHear,
    }

    const res = await registerVolunteer(payload)
    setLoading(false)

    if (res.success) {
      setResult('success')
    } else if (res.duplicate) {
      setResult('duplicate')
    } else {
      setErrorMsg(res.error)
    }
  }

  if (result === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${brandColor}15` }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: brandColor }} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">¡Gracias por registrarte!</h2>
        <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
          Hemos recibido tus datos. Pronto un coordinador se pondrá en contacto contigo para darte la bienvenida al equipo.
        </p>
      </div>
    )
  }

  if (result === 'duplicate') {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">¡Ya estás registrado!</h2>
        <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
          Tu correo ya está en nuestro sistema. Si tienes alguna pregunta, comunícate directamente con el equipo de campaña.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Nombre <span className="text-red-500">*</span></Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="María"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Apellido <span className="text-red-500">*</span></Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="García"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico <span className="text-red-500">*</span></Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="maria@ejemplo.com"
          required
        />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">Teléfono / WhatsApp <span className="text-red-500">*</span></Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+57 300 000 0000"
          required
        />
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label htmlFor="city">Ciudad o barrio</Label>
        <Input
          id="city"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Bogotá"
        />
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <Label>Disponibilidad (selecciona todos los que apliquen)</Label>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABILITY_OPTIONS.map(opt => {
            const selected = availability.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleAvailability(opt.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selected
                    ? 'border-transparent text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                }`}
                style={selected ? { backgroundColor: brandColor, borderColor: brandColor } : undefined}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* How did you hear */}
      <div className="space-y-1.5">
        <Label>¿Cómo nos conociste?</Label>
        <Select value={howDidYouHear} onValueChange={setHowDidYouHear}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            {HOW_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{errorMsg}</p>
      )}

      <Button
        type="submit"
        className="w-full text-white h-11 text-base font-semibold"
        style={{ backgroundColor: brandColor }}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Registrando...</>
        ) : (
          '¡Quiero ser voluntario!'
        )}
      </Button>

      <p className="text-xs text-slate-400 text-center leading-relaxed">
        Al enviar este formulario aceptas que la campaña almacene tu información de contacto para coordinar actividades de voluntariado.
      </p>
    </form>
  )
}
