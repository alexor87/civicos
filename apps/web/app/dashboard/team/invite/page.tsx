import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { inviteTeamMember } from '../actions'

export default function InviteMemberPage() {
  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 pb-8 border-b border-gray-100">
        <Link href="/dashboard/team" className="hover:text-foreground">Equipo</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Invitar miembro</span>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo miembro del equipo
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            El miembro recibirá un email de invitación con un link para acceder a su cuenta.
          </p>
        </CardHeader>
        <CardContent>
          <form action={inviteTeamMember} className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="ej. María López"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ej. maria@campaña.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="ej. +57 300 000 0000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Rol *</Label>
              <Select name="role" required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Seleccionar rol…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volunteer">Voluntario</SelectItem>
                  <SelectItem value="field_coordinator">Coordinador de Terreno</SelectItem>
                  <SelectItem value="analyst">Analista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/dashboard/team">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                Agregar al equipo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
