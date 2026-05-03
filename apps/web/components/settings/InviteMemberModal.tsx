'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, UserPlus } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onInvited: () => void
}

const ROLES = [
  {
    value: 'campaign_manager',
    label: 'Campaign Manager',
    icon: '👔',
    description: 'Acceso completo a la plataforma. Puede configurar la campaña, gestionar el equipo, aprobar decisiones y ver todos los reportes.',
  },
  {
    value: 'field_coordinator',
    label: 'Coordinador de Terreno',
    icon: '🗺️',
    description: 'Puede ver y coordinar su equipo de voluntarios, aprobar registros de visita, reasignar territorios y enviar mensajes a su equipo.',
  },
  {
    value: 'volunteer',
    label: 'Voluntario',
    icon: '🚪',
    description: 'Acceso solo a su lista de casas asignadas y al registro de visitas. Usa principalmente la app móvil.',
  },
  {
    value: 'analyst',
    label: 'Analista',
    icon: '📊',
    description: 'Acceso a todos los reportes, métricas y la base de datos de contactos. No puede modificar datos ni gestionar el equipo.',
  },
  {
    value: 'comms_coordinator',
    label: 'Coordinador de Comunicaciones',
    icon: '📢',
    description: 'Acceso a la bandeja de mensajes, campañas de email/SMS y métricas de comunicaciones.',
  },
]

export function InviteMemberModal({ open, onClose, onInvited }: Props) {
  const [email,    setEmail]    = useState('')
  const [role,     setRole]     = useState('')
  const [fullName, setFullName] = useState('')
  const [phone,    setPhone]    = useState('')
  const [sending,  setSending]  = useState(false)

  const selectedRole = ROLES.find(r => r.value === role)
  const isValid = email.includes('@') && role !== ''

  const handleSubmit = async () => {
    if (!isValid) return
    setSending(true)

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role, full_name: fullName.trim() || null, phone: phone.trim() || null }),
      })

      if (res.ok) {
        const data = await res.json().catch(() => ({})) as { existing_user?: boolean; email_failed?: boolean }
        const target = email.trim()
        if (data.existing_user && data.email_failed) {
          toast.warning(`${target} ya tenía cuenta y fue agregado al equipo, pero no pudimos enviarle la notificación por email.`)
        } else if (data.existing_user) {
          toast.success(`${target} ya tenía cuenta. Lo agregamos al equipo y le enviamos una notificación por email.`)
        } else {
          toast.success(`Invitación enviada a ${target}. Recibirá un email para crear su cuenta.`)
        }
        setEmail('')
        setRole('')
        setFullName('')
        setPhone('')
        onInvited()
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Error al enviar la invitación')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invitar al equipo
          </DialogTitle>
          <DialogDescription>
            El miembro recibirá un email de invitación con un link para acceder a la plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email *</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="maria@campaña.com"
            />
          </div>

          {/* Rol */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Rol *</Label>
            <select
              id="invite-role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleccionar rol…</option>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Role description */}
          {selectedRole && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
              <p className="text-sm font-medium text-slate-700">
                {selectedRole.icon} {selectedRole.label}
              </p>
              <p className="text-xs text-slate-500 mt-1">{selectedRole.description}</p>
            </div>
          )}

          {/* Nombre (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Nombre completo</Label>
            <Input
              id="invite-name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="María López"
            />
          </div>

          {/* Phone (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-phone">Teléfono</Label>
            <Input
              id="invite-phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+57 300 000 0000"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || sending}>
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {sending ? 'Enviando…' : 'Enviar invitación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
