'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import type { RoleData } from '@/components/settings/RolesPermissionsClient'

const COLOR_PRESETS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
]

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (role: RoleData) => void
  existingRoles: RoleData[]
}

export function CreateRoleModal({ open, onClose, onCreated, existingRoles }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLOR_PRESETS[0])
  const [baseRoleId, setBaseRoleId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    const trimmed = name.trim()
    if (trimmed.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres')
      return
    }
    if (trimmed.length > 40) {
      setError('El nombre no puede tener más de 40 caracteres')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          description: description.trim() || null,
          color,
          base_role_id: baseRoleId || null,
        }),
      })

      if (res.ok) {
        const newRole = await res.json()
        toast.success(`Rol "${trimmed}" creado`)
        onCreated(newRole)
        // Reset form
        setName('')
        setDescription('')
        setColor(COLOR_PRESETS[0])
        setBaseRoleId('')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Error al crear el rol')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Crear nuevo rol</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Nombre *</Label>
            <Input
              id="role-name"
              placeholder="Ej: Coordinador Regional"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c ? 'border-slate-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="base-role">Basado en (permisos iniciales)</Label>
            <select
              id="base-role"
              value={baseRoleId}
              onChange={e => setBaseRoleId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Sin base (todos los permisos desactivados)</option>
              {existingRoles.filter(r => r.base_role_key !== 'super_admin').map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-desc">Descripción</Label>
            <Input
              id="role-desc"
              placeholder="Descripción breve del rol"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creando...' : 'Crear rol'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
