'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { PasswordStrengthBar } from '@/components/perfil/PasswordStrengthBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Monitor, Smartphone, Globe, X } from 'lucide-react'

interface Session {
  id: string
  user_agent: string
  ip: string | null
  created_at: string
  updated_at: string
  is_current: boolean
}

function parseUserAgent(ua: string): { browser: string; os: string; icon: typeof Monitor } {
  let browser = 'Navegador desconocido'
  let os = 'OS desconocido'
  let icon = Globe

  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Edge')) browser = 'Edge'

  if (ua.includes('Windows')) { os = 'Windows'; icon = Monitor }
  else if (ua.includes('Mac')) { os = 'macOS'; icon = Monitor }
  else if (ua.includes('Linux')) { os = 'Linux'; icon = Monitor }
  else if (ua.includes('Android')) { os = 'Android'; icon = Smartphone }
  else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; icon = Smartphone }

  return { browser: `${browser} — ${os}`, os, icon }
}

export default function SeguridadPage() {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [closingSession, setClosingSession] = useState<string | null>(null)

  useEffect(() => {
    // Note: Sessions require admin access to auth.sessions table
    // For now we show a placeholder until the admin API is set up
    setLoadingSessions(false)
  }, [])

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos son requeridos')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
        return
      }
      toast.success('Contraseña actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Error al cambiar la contraseña')
    } finally {
      setChangingPassword(false)
    }
  }

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const passwordMismatch = confirmPassword && newPassword !== confirmPassword

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Seguridad</h1>
        <p className="text-sm text-slate-500 mt-1">Contraseña y sesiones activas</p>
      </div>

      {/* Password change */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Cambiar contraseña</h3>

        <div>
          <Label htmlFor="current_password">Contraseña actual</Label>
          <Input
            id="current_password"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Tu contraseña actual"
          />
        </div>

        <div>
          <Label htmlFor="new_password">Nueva contraseña</Label>
          <Input
            id="new_password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
          <div className="mt-2">
            <PasswordStrengthBar password={newPassword} />
          </div>
        </div>

        <div>
          <Label htmlFor="confirm_password">Confirmar nueva contraseña</Label>
          <Input
            id="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repite la nueva contraseña"
            className={passwordMismatch ? 'border-red-300 focus:ring-red-500/50' : ''}
          />
          {passwordMismatch && (
            <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
          )}
        </div>

        <Button
          onClick={handlePasswordChange}
          disabled={changingPassword || !currentPassword || !newPassword || !passwordsMatch}
        >
          {changingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Cambiar contraseña
        </Button>
      </div>

      <Separator />

      {/* Active sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Sesiones activas</h3>
            <p className="text-xs text-slate-500 mt-0.5">Dispositivos donde has iniciado sesión</p>
          </div>
          {sessions.length > 1 && (
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              Cerrar todas las otras
            </Button>
          )}
        </div>

        {loadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-slate-50 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-500">La información de sesiones estará disponible próximamente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(session => {
              const { browser, icon: DeviceIcon } = parseUserAgent(session.user_agent)
              return (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <DeviceIcon className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{browser}</p>
                      <p className="text-xs text-slate-400">
                        Último acceso: {new Date(session.updated_at).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.is_current ? (
                      <Badge variant="secondary">Esta sesión</Badge>
                    ) : (
                      <button
                        onClick={() => setClosingSession(session.id)}
                        disabled={closingSession === session.id}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Cerrar sesión"
                      >
                        {closingSession === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
