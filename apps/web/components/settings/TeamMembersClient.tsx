'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Users, UserPlus, Search, MoreHorizontal, ShieldCheck, UserX, RefreshCw } from 'lucide-react'
import { InviteMemberModal } from '@/components/settings/InviteMemberModal'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Member {
  id:         string
  full_name:  string | null
  email:      string | null
  role:       string
  created_at: string
}

interface Props {
  members:       Member[]
  currentUserId: string
  canManage:     boolean
  tenantId:      string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  super_admin:        'Super Admin',
  campaign_manager:   'Campaign Manager',
  field_coordinator:  'Coordinador de Terreno',
  volunteer:          'Voluntario',
  analyst:            'Analista',
  comms_coordinator:  'Coord. Comunicaciones',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin:       'bg-slate-700 text-white',
  campaign_manager:  'bg-blue-50 text-blue-700',
  field_coordinator: 'bg-teal-50 text-teal-700',
  volunteer:         'bg-emerald-50 text-emerald-700',
  analyst:           'bg-purple-50 text-purple-700',
  comms_coordinator: 'bg-pink-50 text-pink-700',
}

const CHANGEABLE_ROLES = [
  { value: 'campaign_manager',  label: 'Campaign Manager' },
  { value: 'field_coordinator', label: 'Coordinador de Terreno' },
  { value: 'volunteer',         label: 'Voluntario' },
  { value: 'analyst',           label: 'Analista' },
  { value: 'comms_coordinator', label: 'Coord. Comunicaciones' },
]

// ── Component ──────────────────────────────────────────────────────────────────

export function TeamMembersClient({ members: initialMembers, currentUserId, canManage }: Props) {
  const [members,          setMembers]          = useState(initialMembers)
  const [showInvite,       setShowInvite]       = useState(false)
  const [search,           setSearch]           = useState('')
  const [roleFilter,       setRoleFilter]       = useState('')
  const [deactivateTarget, setDeactivateTarget] = useState<Member | null>(null)
  const [changeRoleTarget, setChangeRoleTarget] = useState<Member | null>(null)
  const [newRole,          setNewRole]          = useState('')

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Filter
  const filtered = members.filter(m => {
    const matchesSearch = !search ||
      (m.full_name?.toLowerCase().includes(search.toLowerCase())) ||
      (m.email?.toLowerCase().includes(search.toLowerCase()))
    const matchesRole = !roleFilter || m.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Counters
  const totalMembers = members.length

  // Actions
  const handleRefreshMembers = async () => {
    try {
      const res = await fetch('/api/team/members')
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members ?? data)
      }
    } catch { /* ignore */ }
  }

  const handleChangeRole = async () => {
    if (!changeRoleTarget || !newRole) return
    try {
      const res = await fetch(`/api/team/${changeRoleTarget.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        toast.success(`Rol de ${changeRoleTarget.full_name ?? changeRoleTarget.email} actualizado`)
        setMembers(prev => prev.map(m => m.id === changeRoleTarget.id ? { ...m, role: newRole } : m))
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Error al cambiar el rol')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setChangeRoleTarget(null)
    setNewRole('')
  }

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    try {
      const res = await fetch(`/api/team/${deactivateTarget.id}/deactivate`, { method: 'POST' })
      if (res.ok) {
        toast.success(`${deactivateTarget.full_name ?? deactivateTarget.email} fue desactivado`)
        setMembers(prev => prev.filter(m => m.id !== deactivateTarget.id))
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Error al desactivar')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setDeactivateTarget(null)
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (members.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1b1f23]">Miembros del equipo</h2>
            <p className="text-sm text-[#6a737d] mt-0.5">0 personas en la organización</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-200 rounded-xl bg-slate-50/50">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Construye tu equipo de campaña</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            Invita a coordinadores, voluntarios y analistas para que trabajen juntos en la plataforma.
            Cada rol tiene acceso a las funciones que necesita.
          </p>
          {canManage && (
            <Button className="mt-6 gap-1.5" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-4 w-4" />
              Invitar primer miembro
            </Button>
          )}
          <div className="mt-6 text-left text-xs text-slate-500 space-y-1">
            <p>○ <strong>Coordinadores</strong> — gestionan territorio y equipos</p>
            <p>○ <strong>Voluntarios</strong> — registran visitas en campo</p>
            <p>○ <strong>Analistas</strong> — acceden a reportes y datos</p>
          </div>
        </div>

        <InviteMemberModal
          open={showInvite}
          onClose={() => setShowInvite(false)}
          onInvited={handleRefreshMembers}
        />
      </div>
    )
  }

  // ── Table state ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#1b1f23]">Miembros del equipo</h2>
          <p className="text-sm text-[#6a737d] mt-0.5">{totalMembers} personas en la organización</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setShowInvite(true)} className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Invitar miembro
          </Button>
        )}
      </div>

      {/* Search & filter (when > 5 members) */}
      {members.length > 5 && (
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="border border-[#dcdee6] rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="text-xs font-semibold text-[#6a737d]">Nombre</TableHead>
              <TableHead className="text-xs font-semibold text-[#6a737d]">Email</TableHead>
              <TableHead className="text-xs font-semibold text-[#6a737d]">Rol</TableHead>
              <TableHead className="text-xs font-semibold text-[#6a737d]">Desde</TableHead>
              {canManage && <TableHead className="text-xs font-semibold text-[#6a737d] w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(member => (
              <TableRow key={member.id} className="hover:bg-muted/60">
                <TableCell className="font-medium text-sm text-[#1b1f23]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-slate-600">{getInitials(member.full_name)}</span>
                    </div>
                    <span>
                      {member.full_name ?? '—'}
                      {member.id === currentUserId && (
                        <span className="ml-2 text-xs text-[#6a737d]">(tú)</span>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-[#6a737d]">{member.email ?? '—'}</TableCell>
                <TableCell>
                  <Badge className={`text-xs ${ROLE_COLORS[member.role] ?? 'bg-muted text-[#6a737d]'}`}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-[#6a737d]">
                  {new Date(member.created_at).toLocaleDateString('es-ES')}
                </TableCell>
                {canManage && (
                  <TableCell>
                    {member.id !== currentUserId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setChangeRoleTarget(member); setNewRole(member.role) }}>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Cambiar rol
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeactivateTarget(member)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Desactivar acceso
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Invite modal */}
      <InviteMemberModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onInvited={handleRefreshMembers}
      />

      {/* Change role dialog */}
      <Dialog open={!!changeRoleTarget} onOpenChange={o => { if (!o) setChangeRoleTarget(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cambiar rol de {changeRoleTarget?.full_name ?? changeRoleTarget?.email}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CHANGEABLE_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleTarget(null)}>Cancelar</Button>
            <Button onClick={handleChangeRole}>Guardar rol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={o => { if (!o) setDeactivateTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar a {deactivateTarget?.full_name ?? deactivateTarget?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta persona perderá acceso inmediato a la plataforma. Puedes reactivar su acceso más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700">
              Sí, desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
