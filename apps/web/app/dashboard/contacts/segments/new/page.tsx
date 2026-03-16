import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SegmentFilterBuilder } from '@/components/dashboard/SegmentFilterBuilder'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createSegment } from '../actions'

export default function NewSegmentPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 pb-8 border-b border-gray-100 mb-8">
        <Link href="/dashboard/contacts" className="text-sm text-muted-foreground hover:text-foreground">
          Contactos
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <Link href="/dashboard/contacts/segments" className="text-sm text-muted-foreground hover:text-foreground">
          Segmentos
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <h1 className="text-xl font-bold text-gray-900">Nuevo segmento</h1>
      </div>

      <form action={createSegment} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" placeholder="ej. Simpatizantes en Bogotá" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe el propósito de este segmento…"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Criterios de filtrado</CardTitle>
          </CardHeader>
          <CardContent>
            <SegmentFilterBuilder />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/contacts/segments">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit">Guardar segmento</Button>
        </div>
      </form>
    </div>
  )
}
