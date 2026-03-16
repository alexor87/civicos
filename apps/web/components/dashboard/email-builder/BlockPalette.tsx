'use client'

import { useDraggable } from '@dnd-kit/core'
import { Type, Image, MousePointer, Minus, AlignJustify, ChevronsUpDown } from 'lucide-react'
import type { BlockType } from '@/lib/email-blocks'

const PALETTE_ITEMS: { type: BlockType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: 'header',
    label: 'Encabezado',
    description: 'Título con fondo de color',
    icon: <Type className="h-4 w-4" />,
  },
  {
    type: 'text',
    label: 'Texto',
    description: 'Párrafos de contenido',
    icon: <AlignJustify className="h-4 w-4" />,
  },
  {
    type: 'image',
    label: 'Imagen',
    description: 'Foto o gráfico',
    icon: <Image className="h-4 w-4" />,
  },
  {
    type: 'button',
    label: 'Botón',
    description: 'Llamada a la acción',
    icon: <MousePointer className="h-4 w-4" />,
  },
  {
    type: 'divider',
    label: 'Divisor',
    description: 'Línea separadora',
    icon: <Minus className="h-4 w-4" />,
  },
  {
    type: 'spacer',
    label: 'Espaciador',
    description: 'Espacio en blanco',
    icon: <ChevronsUpDown className="h-4 w-4" />,
  },
]

interface PaletteItemProps {
  type: BlockType
  label: string
  description: string
  icon: React.ReactNode
}

function PaletteItem({ type, label, description, icon }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-3 p-2.5 rounded-lg border bg-background cursor-grab active:cursor-grabbing
        hover:border-primary/50 hover:bg-primary/5 transition-all select-none
        ${isDragging ? 'opacity-40 border-primary' : 'border-border'}
      `}
    >
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-none">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
      </div>
    </div>
  )
}

export function BlockPalette() {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
        Bloques
      </p>
      <div className="flex flex-col gap-1.5">
        {PALETTE_ITEMS.map(item => (
          <PaletteItem key={item.type} {...item} />
        ))}
      </div>
    </div>
  )
}
