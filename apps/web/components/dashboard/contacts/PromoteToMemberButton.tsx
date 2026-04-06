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
    const result = await promoteContactToMember(contactId, role)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${contactName} fue invitado al equipo. Recibirá un email de acceso.`)
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
              onSelect={() => handlePromote(r.value)}
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
