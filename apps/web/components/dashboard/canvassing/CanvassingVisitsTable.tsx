'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, MapPin, CheckCircle, ChevronRight } from 'lucide-react'
import { ApproveVisitButtons } from '@/components/dashboard/ApproveVisitButtons'
import { VisitDetailSheet, type VisitRow } from './VisitDetailSheet'

const resultColors: Record<string, string> = {
  contacted:       'bg-[#28a745]/10 text-[#28a745]',
  positive:        'bg-[#28a745]/10 text-[#28a745]',
  negative:        'bg-red-50 text-red-600',
  undecided:       'bg-[#f8cf0c]/20 text-[#2a2a2a]',
  no_home:         'bg-[#f6f7f8] text-[#6a737d]',
  not_home:        'bg-[#f6f7f8] text-[#6a737d]',
  neighbor_absent: 'bg-[#f6f7f8] text-[#6a737d]',
  follow_up:       'bg-[#2960ec]/10 text-[#2960ec]',
  refused:         'bg-orange-50 text-orange-600',
  moved:           'bg-[#6f42c1]/10 text-[#6f42c1]',
  wrong_address:   'bg-[#6f42c1]/10 text-[#6f42c1]',
  deceased:        'bg-[#f6f7f8] text-[#6a737d]',
  come_back_later: 'bg-[#2960ec]/10 text-[#2960ec]',
  inaccessible:    'bg-[#f6f7f8] text-[#6a737d]',
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

interface Props {
  visits: VisitRow[]
  canApprove: boolean
}

export function CanvassingVisitsTable({ visits, canApprove }: Props) {
  const [selectedVisit, setSelectedVisit] = useState<VisitRow | null>(null)

  if (!visits.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
        <div className="h-14 w-14 rounded-full bg-[#f6f7f8] border border-[#dcdee6] flex items-center justify-center">
          <MapPin className="h-6 w-6 text-[#dcdee6]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1b1f23]">Sin visitas registradas</p>
          <p className="text-xs text-[#6a737d] mt-1">
            Registra la primera visita de canvassing para ver la actividad del equipo
          </p>
        </div>
        <Link href="/dashboard/canvassing/visits/new">
          <Button size="sm" className="mt-1">
            <Plus className="h-4 w-4 mr-1.5" />
            Registrar primera visita
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-[#f6f7f8]/60">
            <TableHead className="text-xs font-semibold text-[#6a737d]">Contacto</TableHead>
            <TableHead className="text-xs font-semibold text-[#6a737d]">Resultado</TableHead>
            <TableHead className="text-xs font-semibold text-[#6a737d]">Voluntario</TableHead>
            <TableHead className="text-xs font-semibold text-[#6a737d]">Estado</TableHead>
            <TableHead className="text-xs font-semibold text-[#6a737d]">Fecha</TableHead>
            {canApprove && (
              <TableHead className="text-xs font-semibold text-[#6a737d]">Acción</TableHead>
            )}
            <TableHead className="w-6" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map(visit => {
            const contact   = visit.contacts
            const volunteer = visit.profiles
            const visitStatus = visit.status ?? (visit.approved_at ? 'approved' : 'submitted')
            const status = statusConfig[visitStatus] ?? statusConfig.submitted
            return (
              <TableRow
                key={visit.id}
                className="hover:bg-[#f6f7f8]/60 transition-colors cursor-pointer"
                onClick={() => setSelectedVisit(visit)}
              >
                <TableCell className="font-medium text-sm text-[#1b1f23]">
                  {contact ? `${contact.first_name} ${contact.last_name}` : '—'}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${resultColors[visit.result] ?? 'bg-[#f6f7f8] text-[#6a737d]'}`}>
                    {resultLabels[visit.result] ?? visit.result}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-[#6a737d]">
                  {volunteer?.full_name ?? '—'}
                </TableCell>
                <TableCell>
                  <span className={`flex items-center gap-1 text-xs font-medium ${status.className}`}>
                    {visitStatus === 'approved' && <CheckCircle className="h-3 w-3" />}
                    {status.label}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-[#6a737d] tabular-nums">
                  {new Date(visit.created_at).toLocaleDateString('es-ES')}
                </TableCell>
                {canApprove && (
                  <TableCell onClick={e => e.stopPropagation()}>
                    {visitStatus === 'submitted' && (
                      <ApproveVisitButtons visitId={visit.id} />
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <ChevronRight className="h-3.5 w-3.5 text-[#dcdee6]" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <VisitDetailSheet
        visit={selectedVisit}
        onClose={() => setSelectedVisit(null)}
        canApprove={canApprove}
      />
    </>
  )
}
