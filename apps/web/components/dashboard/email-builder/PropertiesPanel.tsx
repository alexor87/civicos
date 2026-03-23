'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { EmailBlock } from '@/lib/email-blocks'

const BLOCK_LABELS: Record<string, string> = {
  header: 'Encabezado',
  text: 'Texto',
  image: 'Imagen',
  button: 'Botón',
  divider: 'Divisor',
  spacer: 'Espaciador',
}

interface Props {
  block: EmailBlock | null
  onChange: (block: EmailBlock) => void
  onDelete: (id: string) => void
}

export function PropertiesPanel({ block, onChange, onDelete }: Props) {
  if (!block) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <span className="text-xl">✏️</span>
        </div>
        <p className="text-sm font-medium text-foreground">Selecciona un bloque</p>
        <p className="text-xs text-muted-foreground mt-1">Haz clic en cualquier bloque del canvas para editarlo directamente</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <p className="text-sm font-semibold">{BLOCK_LABELS[block.type]}</p>
          <p className="text-xs text-muted-foreground">Edición en el canvas</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
          onClick={() => onDelete(block.id)}
          title="Eliminar bloque"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Universal hint */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Haz clic en el bloque para editarlo directamente en el canvas
        </p>
      </div>
    </div>
  )
}
