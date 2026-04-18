'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Search, SlidersHorizontal, Plus, ChevronLeft, ChevronRight, Users, CheckCircle, MessageCircle, EyeOff, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useTransition, useState } from 'react'
import type { Database } from '@/lib/types/database'
import { ContactQuickProfile } from './ContactQuickProfile'
import { ContactEntryModal } from '@/components/contacts/ContactEntryModal'

type Contact = Database['public']['Tables']['contacts']['Row']

const sympathyConfig = {
  supporter: { label: 'ALTO', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  undecided: { label: 'MEDIO', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  opponent: { label: 'BAJO', className: 'bg-red-50 text-red-700 border-red-200' },
  unknown: { label: 'BAJO', className: 'bg-slate-100 text-slate-500 border-slate-200' },
} as const

const levelConfig = {
  completo: { icon: CheckCircle, className: 'text-emerald-500', label: 'Completo' },
  opinion: { icon: MessageCircle, className: 'text-blue-500', label: 'Opinión' },
  anonimo: { icon: EyeOff, className: 'text-slate-400', label: 'Anónimo' },
} as const

function getContactLevel(contact: Contact): string {
  return ((contact as Record<string, unknown>).contact_level as string) ?? 'completo'
}

function getDisplayName(contact: Contact): { name: string; initials: string } {
  const level = getContactLevel(contact)
  if (level === 'anonimo') {
    const displayName = (contact as Record<string, unknown>).display_name as string
    return { name: displayName ?? 'Anónimo', initials: 'AN' }
  }
  return {
    name: `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || '—',
    initials: `${(contact.first_name ?? '')[0] ?? ''}${(contact.last_name ?? '')[0] ?? ''}`.toUpperCase(),
  }
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

function avatarColor(id: string) {
  const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function getProfileCompletion(contact: Contact): number {
  const fields = [
    contact.first_name,
    contact.last_name,
    contact.phone,
    contact.email,
    (contact as Record<string, unknown>).document_number,
    (contact as Record<string, unknown>).department,
    (contact as Record<string, unknown>).municipality ?? contact.city,
    contact.address,
    ((contact.metadata as Record<string, unknown>) ?? {}).political_affinity,
    ((contact.metadata as Record<string, unknown>) ?? {}).vote_intention,
  ]
  const filled = fields.filter((v) => v !== null && v !== undefined && v !== '').length
  return Math.round((filled / fields.length) * 100)
}

interface Props {
  contacts: Contact[]
  estimatedTotal: number
  pageSize: number
  nextCursor?: string
  prevCursor?: string
  hasMore: boolean
  hasPrev: boolean
  searchQuery?: string
  statusFilter?: string
  levelFilter?: string
  campaignId?: string
}

export function ContactsTable({
  contacts, estimatedTotal, pageSize, nextCursor, prevCursor,
  hasMore, hasPrev, searchQuery, statusFilter, levelFilter, campaignId,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParamsHook = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/contacts/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error === 'Sin permisos' ? 'No tienes permisos para eliminar contactos' : 'Error al eliminar contacto')
        return
      }
      const display = getDisplayName(deleteTarget)
      toast.success(`${display.name} eliminado`)
      router.refresh()
    } catch {
      toast.error('Error al eliminar contacto')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }, [deleteTarget, router])

  const updateQuery = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParamsHook.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset cursor when filters change
    params.delete('cursor')
    params.delete('direction')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [router, pathname, searchParamsHook])

  const navigateCursor = useCallback((cursor: string, direction: 'next' | 'prev') => {
    const params = new URLSearchParams(searchParamsHook.toString())
    params.set('cursor', cursor)
    params.set('direction', direction)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [router, pathname, searchParamsHook])

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar contactos..."
                defaultValue={searchQuery}
                className="h-9 pl-9 bg-white"
                onChange={e => updateQuery('q', e.target.value)}
              />
            </div>

            <Select value={statusFilter ?? 'all'} onValueChange={(v) => updateQuery('status', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-48 bg-white">
                <SelectValue placeholder="Puntaje de Simpatía" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los puntajes</SelectItem>
                <SelectItem value="supporter">ALTO — Simpatizante</SelectItem>
                <SelectItem value="undecided">MEDIO — Indeciso</SelectItem>
                <SelectItem value="opponent">BAJO — Opositor</SelectItem>
                <SelectItem value="unknown">BAJO — Desconocido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter ?? 'all'} onValueChange={(v) => updateQuery('level', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-40 bg-white">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="completo">Completo</SelectItem>
                <SelectItem value="opinion">Opinión</SelectItem>
                <SelectItem value="anonimo">Anónimo</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-slate-600">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </Button>
          </div>

          <Button size="sm" className="h-9 gap-1.5" onClick={() => setShowEntryModal(true)}>
            <Plus className="h-4 w-4" />
            Añadir Contacto
          </Button>
        </div>

        {/* Top Pagination */}
        {(hasPrev || hasMore) && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {contacts.length} contactos de {estimatedTotal.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                disabled={!hasPrev || isPending}
                onClick={() => prevCursor && navigateCursor(prevCursor, 'prev')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={!hasMore || isPending}
                onClick={() => nextCursor && navigateCursor(nextCursor, 'next')}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide pl-4">Nombre / Email</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dirección</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Zona</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Simpatía</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {searchQuery ? 'Sin resultados' : 'Aún no hay contactos'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs">
                        {searchQuery
                          ? `No se encontraron contactos para "${searchQuery}"`
                          : 'Importa un CSV o añade contactos para empezar.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map(contact => {
                  const sympathy = sympathyConfig[contact.status] ?? sympathyConfig.unknown
                  const level = getContactLevel(contact)
                  const display = getDisplayName(contact)
                  const avatarCls = avatarColor(contact.id)
                  const isSelected = selectedContact?.id === contact.id
                  const LevelIcon = levelConfig[level as keyof typeof levelConfig]?.icon

                  return (
                    <TableRow
                      key={contact.id}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-blue-50/60' : ''}`}
                      onClick={() => setSelectedContact(isSelected ? null : contact)}
                    >
                      {/* NOMBRE / EMAIL */}
                      <TableCell className="pl-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${avatarCls}`}>
                            {display.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {LevelIcon && level !== 'completo' && (
                                <LevelIcon className={`h-3.5 w-3.5 flex-shrink-0 ${levelConfig[level as keyof typeof levelConfig]?.className}`} />
                              )}
                              <p className="text-sm font-medium text-slate-900 leading-tight">
                                {display.name}
                              </p>
                            </div>
                            <p className="text-xs text-slate-400 truncate">{contact.email ?? '—'}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* DIRECCIÓN */}
                      <TableCell className="py-3">
                        <p className="text-sm text-slate-600 truncate max-w-[200px]">
                          {contact.address ? contact.address : '—'}
                        </p>
                        {contact.city && (
                          <p className="text-xs text-slate-400">{contact.city}</p>
                        )}
                      </TableCell>

                      {/* ZONA */}
                      <TableCell className="py-3">
                        <span className="text-sm text-slate-600">
                          {contact.district ?? '—'}
                        </span>
                      </TableCell>

                      {/* SIMPATÍA */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-xs font-semibold tracking-wide ${sympathy.className}`}>
                            {sympathy.label}
                          </Badge>
                          {getProfileCompletion(contact) < 80 && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              Completar
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* ACCIONES */}
                      <TableCell className="py-3 pr-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/contacts/${contact.id}`) }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/contacts/${contact.id}/edit`) }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(contact) }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Cursor-based Pagination */}
        {(hasPrev || hasMore) && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {contacts.length} contactos de {estimatedTotal.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                disabled={!hasPrev || isPending}
                onClick={() => prevCursor && navigateCursor(prevCursor, 'prev')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={!hasMore || isPending}
                onClick={() => nextCursor && navigateCursor(nextCursor, 'next')}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Profile Panel */}
      {selectedContact && (
        <ContactQuickProfile
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}

      {/* Entry Modal (Quick Add / Full Form) */}
      <ContactEntryModal
        open={showEntryModal}
        onOpenChange={setShowEntryModal}
        campaignId={campaignId ?? ''}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `El contacto ${getDisplayName(deleteTarget).name} será archivado. Podrás restaurarlo más adelante.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
