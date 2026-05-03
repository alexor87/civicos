'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { promoteContactToMember } from '@/app/dashboard/team/actions'

const ROLES = [
  { value: 'volunteer',         label: 'Voluntario' },
  { value: 'field_coordinator', label: 'Coordinador de Terreno' },
  { value: 'analyst',           label: 'Analista' },
]

interface Props {
  contactId: string
  contactName: string
}

export function PromoteToMemberButton({ contactId, contactName }: Props) {
  const [loading, setLoading] = useState(false)

  const handlePromote = async (role: string) => {
    setLoading(true)
    const toastId = toast.loading('Procesando…')
    try {
      const result = await promoteContactToMember(contactId, role)
      if (result.error) {
        toast.error(result.error, { id: toastId })
      } else if (result.existing_user && result.email_failed) {
        toast.warning(`${contactName} ya tenía cuenta y fue agregado al equipo, pero no pudimos enviarle la notificación por email. Avísale manualmente.`, { id: toastId })
      } else if (result.existing_user) {
        toast.success(`${contactName} ya tenía cuenta. Lo agregamos al equipo y le enviamos una notificación por email.`, { id: toastId })
      } else {
        toast.success(`${contactName} fue invitado al equipo. Recibirá un email para crear su cuenta.`, { id: toastId })
      }
    } catch (err) {
      toast.error(`Error al invitar: ${err instanceof Error ? err.message : String(err)}`, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')} disabled={loading}>
        <UserPlus className="h-3.5 w-3.5" />
        {loading ? 'Invitando…' : 'Agregar al equipo'}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Selecciona el rol
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ROLES.map(r => (
            <DropdownMenuItem
              key={r.value}
              onClick={() => handlePromote(r.value)}
              className="cursor-pointer"
            >
              {r.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
