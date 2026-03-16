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
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useTransition } from 'react'
import type { Database } from '@/lib/types/database'

type Contact = Database['public']['Tables']['contacts']['Row']

const statusConfig: Record<string, { label: string; className: string }> = {
  supporter: { label: 'Simpatizante', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  undecided: { label: 'Indeciso', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  opponent: { label: 'Opositor', className: 'bg-red-50 text-red-700 border-red-200' },
  unknown: { label: 'Desconocido', className: '' },
}

interface Props {
  contacts: Contact[]
  total: number
  page: number
  pageSize: number
  searchQuery?: string
  statusFilter?: string
}

export function ContactsTable({ contacts, total, page, pageSize, searchQuery, statusFilter }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParamsHook = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateQuery = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParamsHook.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [router, pathname, searchParamsHook])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contactos..."
            defaultValue={searchQuery}
            className="h-9 pl-8"
            onChange={e => updateQuery('q', e.target.value)}
          />
        </div>
        <Select value={statusFilter ?? 'all'} onValueChange={(v) => updateQuery('status', (v ?? 'all') === 'all' ? '' : (v ?? ''))}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="supporter">Simpatizantes</SelectItem>
            <SelectItem value="undecided">Indecisos</SelectItem>
            <SelectItem value="opponent">Opositores</SelectItem>
            <SelectItem value="unknown">Desconocidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-xs font-medium">Nombre</TableHead>
              <TableHead className="text-xs font-medium">Email</TableHead>
              <TableHead className="text-xs font-medium">Teléfono</TableHead>
              <TableHead className="text-xs font-medium">Ciudad</TableHead>
              <TableHead className="text-xs font-medium">Estado</TableHead>
              <TableHead className="text-xs font-medium">Tags</TableHead>
              <TableHead className="text-xs font-medium">Registrado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold">
                      {searchQuery ? 'Sin resultados' : 'Aún no hay contactos'}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {searchQuery ? `No se encontraron contactos para "${searchQuery}"` : 'Importa un CSV para empezar.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map(contact => {
                const config = statusConfig[contact.status] ?? statusConfig.unknown
                return (
                  <TableRow
                    key={contact.id}
                    className="hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                  >
                    <TableCell className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{contact.email ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{contact.phone ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{contact.city ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.status === 'unknown'
                        ? <Badge variant="secondary">{config.label}</Badge>
                        : <Badge variant="outline" className={config.className}>{config.label}</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        {contact.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{contact.tags.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1 || isPending}
              onClick={() => updateQuery('page', String(page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground font-medium tabular-nums">Página {page} de {totalPages}</span>
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages || isPending}
              onClick={() => updateQuery('page', String(page + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
