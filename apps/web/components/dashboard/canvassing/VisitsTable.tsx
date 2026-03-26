'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ApproveVisitButtons } from '@/components/dashboard/ApproveVisitButtons'

// ── Shared constants ──────────────────────────────────────────────────────────

const resultColors: Record<string, string> = {
  contacted:       'bg-[#28a745]/10 text-[#28a745]',
  positive:        'bg-[#28a745]/10 text-[#28a745]',
  negative:        'bg-red-50 text-red-600',
  undecided:       'bg-[#f8cf0c]/20 text-[#2a2a2a]',
  no_home:         'bg-muted text-[#6a737d]',
  not_home:        'bg-muted text-[#6a737d]',
  neighbor_absent: 'bg-muted text-[#6a737d]',
  follow_up:       'bg-[#2960ec]/10 text-[#2960ec]',
  refused:         'bg-orange-50 text-orange-600',
  moved:           'bg-[#6f42c1]/10 text-[#6f42c1]',
  wrong_address:   'bg-[#6f42c1]/10 text-[#6f42c1]',
  deceased:        'bg-muted text-[#6a737d]',
  come_back_later: 'bg-[#2960ec]/10 text-[#2960ec]',
  inaccessible:    'bg-muted text-[#6a737d]',
}

const resultLabels: Record<string, string> = {
  contacted:       'Contactado',
  positive:        'Positivo',
  negative:        'Negativo',
  undecided:       'Indeciso',
  no_home:         'No en casa',
  not_home:        'No en casa',
  neighbor_absent: 'Vecino informó',
  follow_up:       'Seguimiento',
  refused:         'Rechazó',
  moved:           'Se mudó',
  wrong_address:   'Dir. incorrecta',
  deceased:        'Fallecido',
  come_back_later: 'Volver después',
  inaccessible:    'Inaccesible',
}

const statusConfig: Record<string, { label: string; className: string }> = {
  approved:  { label: 'Aprobada',  className: 'text-[#28a745]' },
  rejected:  { label: 'Rechazada', className: 'text-red-500' },
  submitted: { label: 'Pendiente', className: 'text-orange-500' },
}

const RESULT_OPTIONS = [
  { value: 'contacted',       label: 'Contactado' },
  { value: 'positive',        label: 'Positivo' },
  { value: 'negative',        label: 'Negativo' },
  { value: 'undecided',       label: 'Indeciso' },
  { value: 'no_home',         label: 'No en casa' },
  { value: 'follow_up',       label: 'Seguimiento' },
  { value: 'refused',         label: 'Rechazó' },
  { value: 'come_back_later', label: 'Volver después' },
  { value: 'moved',           label: 'Se mudó' },
  { value: 'wrong_address',   label: 'Dir. incorrecta' },
  { value: 'deceased',        label: 'Fallecido' },
  { value: 'inaccessible',    label: 'Inaccesible' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface Visit {
  id: string
  result: string
  status: string
  created_at: string
  contacts:    { first_name: string; last_name: string } | null
  profiles:    { full_name: string | null } | null
  territories: { name: string; color: string } | null
}

interface Props {
  visits:          Visit[]
  total:           number
  page:            number
  pageSize:        number
  territories:     { id: string; name: string; color: string }[]
  canApprove:      boolean
  resultFilter?:   string
  statusFilter?:   string
  territoryFilter?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VisitsTable({
  visits,
  total,
  page,
  pageSize,
  territories,
  canApprove,
  resultFilter,
  statusFilter,
  territoryFilter,
}: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(total / pageSize)
  const from       = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to         = Math.min(page * pageSize, total)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // reset pagination on filter change
    router.replace(`${pathname}?${params.toString()}`)
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        <select
          value={resultFilter ?? ''}
          onChange={e => updateParam('result', e.target.value)}
          className="h-8 rounded-md border border-[#dcdee6] bg-white px-3 text-sm text-[#1b1f23] focus:outline-none focus:ring-2 focus:ring-[#2960ec]/30"
        >
          <option value="">Todos los resultados</option>
          {RESULT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={statusFilter ?? ''}
          onChange={e => updateParam('status', e.target.value)}
          className="h-8 rounded-md border border-[#dcdee6] bg-white px-3 text-sm text-[#1b1f23] focus:outline-none focus:ring-2 focus:ring-[#2960ec]/30"
        >
          <option value="">Todos los estados</option>
          <option value="submitted">Pendiente</option>
          <option value="approved">Aprobada</option>
          <option value="rejected">Rechazada</option>
        </select>

        <select
          value={territoryFilter ?? ''}
          onChange={e => updateParam('territory', e.target.value)}
          className="h-8 rounded-md border border-[#dcdee6] bg-white px-3 text-sm text-[#1b1f23] focus:outline-none focus:ring-2 focus:ring-[#2960ec]/30"
        >
          <option value="">Todos los territorios</option>
          {territories.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
        {visits.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
            <p className="text-sm font-semibold text-[#1b1f23]">Sin visitas registradas</p>
            <p className="text-xs text-[#6a737d]">Ajusta los filtros para ver resultados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="text-xs font-semibold text-[#6a737d]">Contacto</TableHead>
                <TableHead className="text-xs font-semibold text-[#6a737d]">Resultado</TableHead>
                <TableHead className="text-xs font-semibold text-[#6a737d]">Voluntario</TableHead>
                <TableHead className="text-xs font-semibold text-[#6a737d]">Territorio</TableHead>
                <TableHead className="text-xs font-semibold text-[#6a737d]">Estado</TableHead>
                <TableHead className="text-xs font-semibold text-[#6a737d]">Fecha</TableHead>
                {canApprove && (
                  <TableHead className="text-xs font-semibold text-[#6a737d]">Acción</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map(visit => {
                const contact    = visit.contacts
                const volunteer  = visit.profiles
                const territory  = visit.territories
                const status     = statusConfig[visit.status] ?? statusConfig.submitted

                return (
                  <TableRow key={visit.id} className="hover:bg-muted/60 transition-colors">
                    <TableCell className="font-medium text-sm text-[#1b1f23]">
                      {contact ? `${contact.first_name} ${contact.last_name}` : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${resultColors[visit.result] ?? 'bg-muted text-[#6a737d]'}`}>
                        {resultLabels[visit.result] ?? visit.result}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#6a737d]">
                      {volunteer?.full_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {territory ? (
                        <span className="flex items-center gap-1.5 text-sm text-[#6a737d]">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: territory.color }}
                          />
                          {territory.name}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 text-xs font-medium ${status.className}`}>
                        {visit.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-[#6a737d] tabular-nums">
                      {new Date(visit.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    {canApprove && (
                      <TableCell>
                        {visit.status === 'submitted' && (
                          <ApproveVisitButtons visitId={visit.id} />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Pagination ── */}
      {total > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[#6a737d]">
            {from} – {to} de {total} visitas
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="h-7 text-xs px-3"
            >
              Anterior
            </Button>
            <span className="text-xs text-[#6a737d]">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="h-7 text-xs px-3"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
