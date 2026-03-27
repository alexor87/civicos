'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import type { RoleData } from '@/components/settings/RolesPermissionsClient'

interface Props {
  role: RoleData
  roles: RoleData[]
  open: boolean
  onClose: () => void
  onDeleted: (id: string) => void
}

export function DeleteRoleDialog({ role, roles, open, onClose, onDeleted }: Props) {
  const [reassignId, setReassignId] = useState('')
  const [deleting, setDeleting] = useState(false)

  const otherRoles = roles.filter(r => r.id !== role.id)
  const hasMembers = role.member_count > 0

  const handleDelete = async () => {
    if (hasMembers && !reassignId) {
      toast.error('Selecciona un rol de reasignación')
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reassign_to_role_id: reassignId || otherRoles[0]?.id }),
      })

      if (res.ok) {
        toast.success(`Rol "${role.name}" eliminado`)
        onDeleted(role.id)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar el rol &quot;{role.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasMembers
              ? `Este rol tiene ${role.member_count} ${role.member_count === 1 ? 'miembro asignado' : 'miembros asignados'}. Selecciona un rol al que reasignarlos.`
              : 'Esta acción no se puede deshacer. Se eliminarán todos los permisos asociados.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasMembers && (
          <div className="py-2">
            <label className="text-sm font-medium text-slate-700">Reasignar miembros a:</label>
            <select
              value={reassignId}
              onChange={e => setReassignId(e.target.value)}
              className="mt-1.5 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleccionar rol...</option>
              {otherRoles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || (hasMembers && !reassignId)}
          >
            {deleting ? 'Eliminando...' : 'Eliminar rol'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
