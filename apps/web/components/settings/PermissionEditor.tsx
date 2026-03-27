'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import { PERMISSION_MODULES, PERMISSION_DEPENDENCIES, ALL_PERMISSIONS, type Permission } from '@/lib/permissions'
import { Shield, Save, RotateCcw, AlertTriangle } from 'lucide-react'
import type { RoleData } from '@/components/settings/RolesPermissionsClient'

interface Props {
  role: RoleData
}

export function PermissionEditor({ role }: Props) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [original, setOriginal] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isSuperAdmin = role.base_role_key === 'super_admin'

  const fetchPermissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/roles/${role.id}/permissions`)
      if (res.ok) {
        const data: { permission: string; is_active: boolean }[] = await res.json()
        const map: Record<string, boolean> = {}
        data.forEach(p => { map[p.permission] = p.is_active })
        setPermissions(map)
        setOriginal(map)
      }
    } catch {
      toast.error('Error al cargar permisos')
    } finally {
      setLoading(false)
    }
  }, [role.id])

  useEffect(() => { fetchPermissions() }, [fetchPermissions])

  const isDirty = JSON.stringify(permissions) !== JSON.stringify(original)

  const handleToggle = (key: Permission, checked: boolean) => {
    const updated = { ...permissions, [key]: checked }

    if (!checked) {
      // Disable all dependents (children that depend on this permission)
      ALL_PERMISSIONS.forEach(p => {
        const deps = PERMISSION_DEPENDENCIES[p]
        if (deps?.includes(key) && updated[p]) {
          updated[p] = false
        }
      })
    } else {
      // Enable all parent dependencies
      const deps = PERMISSION_DEPENDENCIES[key]
      deps?.forEach(parent => {
        updated[parent] = true
      })
    }

    setPermissions(updated)
  }

  const handleModuleToggle = (modulePerms: Permission[], checked: boolean) => {
    const updated = { ...permissions }
    modulePerms.forEach(p => {
      updated[p] = checked
      if (!checked) {
        // Disable dependents
        ALL_PERMISSIONS.forEach(dep => {
          if (PERMISSION_DEPENDENCIES[dep]?.includes(p)) {
            updated[dep] = false
          }
        })
      }
    })
    setPermissions(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = ALL_PERMISSIONS.map(p => ({
        permission: p,
        is_active: permissions[p] ?? false,
      }))
      const res = await fetch(`/api/roles/${role.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: payload }),
      })
      if (res.ok) {
        toast.success('Permisos guardados correctamente')
        setOriginal(permissions)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setPermissions(original)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border border-slate-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: role.color }} />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{role.name}</h3>
            <p className="text-xs text-slate-500">
              {role.member_count} {role.member_count === 1 ? 'miembro' : 'miembros'}
              {role.is_system && ' · Rol del sistema'}
            </p>
          </div>
        </div>
        {!isSuperAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleReset}
              disabled={!isDirty}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </div>

      {/* Dirty banner */}
      {isDirty && !isSuperAdmin && (
        <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Tienes cambios sin guardar
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isSuperAdmin ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Shield className="h-12 w-12 text-slate-300 mb-4" />
            <h4 className="text-sm font-semibold text-slate-700">Acceso total</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              El rol Super Admin tiene acceso completo a todos los módulos y funciones de la plataforma.
              Este rol no se puede modificar.
            </p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={PERMISSION_MODULES.map(m => m.key)} className="space-y-2">
            {PERMISSION_MODULES.map(mod => {
              const modPerms = mod.permissions.map(p => p.key)
              const activeCount = modPerms.filter(p => permissions[p]).length
              const allActive = activeCount === modPerms.length
              const someActive = activeCount > 0 && !allActive

              return (
                <AccordionItem key={mod.key} value={mod.key} className="border border-slate-200 rounded-lg px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <Switch
                        checked={allActive}
                        className={someActive ? 'data-[state=unchecked]:bg-primary/40' : ''}
                        onCheckedChange={(checked) => {
                          handleModuleToggle(modPerms, checked)
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm font-medium text-slate-900">{mod.name}</span>
                      <Badge variant="secondary" className="text-[10px] ml-auto mr-2">
                        {activeCount}/{modPerms.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-3 pl-1">
                      {mod.permissions.map(perm => (
                        <div key={perm.key} className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700">{perm.label}</p>
                            <p className="text-xs text-slate-400">{perm.description}</p>
                          </div>
                          <Switch
                            checked={permissions[perm.key] ?? false}
                            onCheckedChange={(checked) => handleToggle(perm.key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </div>
  )
}
