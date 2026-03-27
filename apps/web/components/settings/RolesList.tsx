'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import type { RoleData } from '@/components/settings/RolesPermissionsClient'

interface Props {
  roles: RoleData[]
  selectedRoleId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (role: RoleData) => void
}

export function RolesList({ roles, selectedRoleId, onSelect, onCreate, onDelete }: Props) {
  const systemRoles = roles.filter(r => r.is_system)
  const customRoles = roles.filter(r => !r.is_system)

  return (
    <div className="flex flex-col h-full border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Roles</h3>
        <p className="text-xs text-slate-500 mt-0.5">{roles.length} roles configurados</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* System roles */}
        <div>
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Roles del sistema
          </p>
          <div className="space-y-0.5">
            {systemRoles.map(role => (
              <RoleItem
                key={role.id}
                role={role}
                selected={role.id === selectedRoleId}
                onSelect={() => onSelect(role.id)}
              />
            ))}
          </div>
        </div>

        {/* Custom roles */}
        {customRoles.length > 0 && (
          <div>
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Roles personalizados
            </p>
            <div className="space-y-0.5">
              {customRoles.map(role => (
                <RoleItem
                  key={role.id}
                  role={role}
                  selected={role.id === selectedRoleId}
                  onSelect={() => onSelect(role.id)}
                  onDelete={() => onDelete(role)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={onCreate}
        >
          <Plus className="h-3.5 w-3.5" />
          Crear nuevo rol
        </Button>
      </div>
    </div>
  )
}

function RoleItem({
  role,
  selected,
  onSelect,
  onDelete,
}: {
  role: RoleData
  selected: boolean
  onSelect: () => void
  onDelete?: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors group ${
        selected
          ? 'bg-primary/10 text-primary'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <div
        className="h-3 w-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: role.color }}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${selected ? 'font-semibold' : 'font-medium'}`}>
          {role.name}
        </p>
        <p className="text-[11px] text-slate-400">
          {role.member_count} {role.member_count === 1 ? 'miembro' : 'miembros'}
        </p>
      </div>
      {role.is_system && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
          Sistema
        </Badge>
      )}
      {onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
          aria-label={`Eliminar ${role.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </button>
  )
}
