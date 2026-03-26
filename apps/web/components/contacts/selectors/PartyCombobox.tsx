'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'

const COLOMBIAN_PARTIES = [
  'Partido Liberal Colombiano',
  'Partido Conservador Colombiano',
  'Partido de la U',
  'Centro Democrático',
  'Cambio Radical',
  'Alianza Verde',
  'Polo Democrático Alternativo',
  'Colombia Humana',
  'Pacto Histórico',
  'MIRA',
  'Colombia Justa Libres',
  'Partido Comunes',
  'Fuerza Ciudadana',
  'Liga de Gobernantes Anticorrupción',
  'Partido ASI',
  'Nuevo Liberalismo',
  'Independiente',
  'Otro',
]

interface Props {
  value: string
  onChange: (value: string) => void
}

export function PartyCombobox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || 'Seleccionar partido...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar partido..." />
          <CommandList>
            <CommandEmpty>No se encontró.</CommandEmpty>
            <CommandGroup>
              {COLOMBIAN_PARTIES.map((party) => (
                <CommandItem
                  key={party}
                  value={party}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === party ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {party}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
