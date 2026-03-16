import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Layers, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ContactSegmentRow } from '@/lib/types/database'

export default async function SegmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]

  const { data: segments } = await supabase
    .from('contact_segments')
    .select('*')
    .eq('campaign_id', campaignId ?? '')
    .order('created_at', { ascending: false })

  const rows = (segments ?? []) as ContactSegmentRow[]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between pb-8 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/contacts" className="text-sm text-muted-foreground hover:text-foreground">
            Contactos
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Segmentos</h1>
        </div>
        <Link href="/dashboard/contacts/segments/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo segmento
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Segmentos guardados
            <span className="text-sm font-normal text-muted-foreground">({rows.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Layers className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">Sin segmentos creados</p>
              <p className="text-xs text-muted-foreground">Crea filtros guardados para acceder rápidamente a grupos de contactos</p>
              <Link href="/dashboard/contacts/segments/new">
                <Button size="sm" variant="outline" className="mt-1">Crear primer segmento</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Filtros</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(seg => (
                  <TableRow key={seg.id}>
                    <TableCell className="font-medium">{seg.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                      {seg.description ?? '—'}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {seg.filters.length} {seg.filters.length === 1 ? 'filtro' : 'filtros'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(seg.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/contacts/segments/${seg.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-800">
                          Ver contactos →
                        </Button>
                      </Link>
                    </TableCell>
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
