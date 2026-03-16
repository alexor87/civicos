import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ChevronRight, Layers, Users, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { applyFilters, deleteSegment } from '../actions'
import type { ContactSegmentRow, SegmentFilter } from '@/lib/types/database'

const FIELD_LABELS: Record<string, string> = {
  status: 'Estado',
  department: 'Departamento',
  municipality: 'Municipio',
  gender: 'Género',
  tags: 'Etiqueta',
  has_visits: 'Visitas',
  sympathy_level: 'Simpatía',
  vote_intention: 'Intención de voto',
}

const OP_LABELS: Record<string, string> = {
  eq: 'es',
  neq: 'no es',
  contains: 'contiene',
  is_true: 'tiene visitas',
  is_false: 'no tiene visitas',
  gte: '≥',
  lte: '≤',
}

function FilterChip({ filter }: { filter: SegmentFilter }) {
  const field = FIELD_LABELS[filter.field] ?? filter.field
  const op = OP_LABELS[filter.operator] ?? filter.operator
  const showValue = !['is_true', 'is_false'].includes(filter.operator)

  return (
    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
      <span className="font-medium">{field}</span>
      <span className="text-indigo-400">{op}</span>
      {showValue && <span>{String(filter.value)}</span>}
    </span>
  )
}

const STATUS_COLORS: Record<string, string> = {
  supporter:  'bg-emerald-50 text-emerald-700',
  prospect:   'bg-blue-50 text-blue-700',
  undecided:  'bg-amber-50 text-amber-700',
  opponent:   'bg-red-50 text-red-700',
  unknown:    'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<string, string> = {
  supporter:  'Simpatizante',
  prospect:   'Prospecto',
  undecided:  'Indeciso',
  opponent:   'Oponente',
  unknown:    'Desconocido',
}

export default async function SegmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0] ?? ''

  // Load segment
  const { data: segData } = await supabase
    .from('contact_segments')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!segData) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Segmento no encontrado.</p>
      </div>
    )
  }

  const segment = segData as ContactSegmentRow

  // Execute filters
  const { data: contacts, count } = await applyFilters(supabase, campaignId, segment.filters)

  const deleteWithId = deleteSegment.bind(null, segment.id)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-8 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard/contacts" className="text-sm text-muted-foreground hover:text-foreground">
              Contactos
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link href="/dashboard/contacts/segments" className="text-sm text-muted-foreground hover:text-foreground">
              Segmentos
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-gray-700">{segment.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Layers className="h-7 w-7 text-indigo-600" />
            {segment.name}
          </h1>
          {segment.description && (
            <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
          )}
        </div>
        <form action={deleteWithId}>
          <Button type="submit" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5">
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </form>
      </div>

      {/* Filters applied */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Filtros activos</CardTitle>
        </CardHeader>
        <CardContent>
          {segment.filters.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin filtros — incluye todos los contactos de la campaña</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {segment.filters.map((f, i) => (
                <FilterChip key={i} filter={f} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts result */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contactos coincidentes
            <span className="text-sm font-normal text-muted-foreground">
              ({count ?? contacts?.length ?? 0}{(count ?? 0) >= 200 ? '+' : ''})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!contacts?.length ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Ningún contacto coincide con los filtros aplicados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Municipio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(contacts as { id: string; first_name: string; last_name: string; status: string; department: string | null; municipality: string | null }[]).map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/contacts/${c.id}`} className="hover:text-indigo-600">
                        {c.first_name} {c.last_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.department ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.municipality ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
