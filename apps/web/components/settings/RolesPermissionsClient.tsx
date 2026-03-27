'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RolesList } from '@/components/settings/RolesList'
import { PermissionEditor } from '@/components/settings/PermissionEditor'
import { CreateRoleModal } from '@/components/settings/CreateRoleModal'
import { DeleteRoleDialog } from '@/components/settings/DeleteRoleDialog'

export interface RoleData {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  is_system: boolean
  base_role_key: string | null
  member_count: number
}

export function RolesPermissionsClient() {
  const [roles, setRoles] = useState<RoleData[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RoleData | null>(null)

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/roles')
      if (res.ok) {
        const data = await res.json()
        setRoles(data)
        if (!selectedRoleId && data.length > 0) {
          setSelectedRoleId(data[0].id)
        }
      } else {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error || `Error ${res.status} al cargar roles`)
      }
    } catch {
      toast.error('Error al cargar roles')
    } finally {
      setLoading(false)
    }
  }, [selectedRoleId])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null

  const handleRoleCreated = (newRole: RoleData) => {
    setRoles(prev => [...prev, { ...newRole, member_count: 0 }])
    setSelectedRoleId(newRole.id)
    setShowCreate(false)
  }

  const handleRoleDeleted = (deletedId: string) => {
    setRoles(prev => prev.filter(r => r.id !== deletedId))
    if (selectedRoleId === deletedId) {
      setSelectedRoleId(roles.find(r => r.id !== deletedId)?.id ?? null)
    }
    setDeleteTarget(null)
    fetchRoles() // refresh counts
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-slate-500">No se encontraron roles configurados.</p>
        <p className="text-xs text-slate-400 mt-1">Recarga la página o contacta al administrador.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => { setLoading(true); fetchRoles() }}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-280px)] min-h-[500px]">
      {/* Left column — Roles list */}
      <div className="w-72 flex-shrink-0">
        <RolesList
          roles={roles}
          selectedRoleId={selectedRoleId}
          onSelect={setSelectedRoleId}
          onCreate={() => setShowCreate(true)}
          onDelete={setDeleteTarget}
        />
      </div>

      {/* Right column — Permission editor */}
      <div className="flex-1 min-w-0">
        {selectedRole ? (
          <PermissionEditor role={selectedRole} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-slate-500">
            Selecciona un rol para ver sus permisos
          </div>
        )}
      </div>

      <CreateRoleModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleRoleCreated}
        existingRoles={roles}
      />

      {deleteTarget && (
        <DeleteRoleDialog
          role={deleteTarget}
          roles={roles}
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleRoleDeleted}
        />
      )}
    </div>
  )
}
