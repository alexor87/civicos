'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { EmailBlock } from '@/lib/email-blocks'
import { HeaderBlockEditor } from './block-editors/HeaderBlockEditor'
import { TextBlockEditor } from './block-editors/TextBlockEditor'
import { ImageBlockEditor } from './block-editors/ImageBlockEditor'
import { ButtonBlockEditor } from './block-editors/ButtonBlockEditor'
import { DividerBlockEditor } from './block-editors/DividerBlockEditor'
import { SpacerBlockEditor } from './block-editors/SpacerBlockEditor'

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
        <p className="text-xs text-muted-foreground mt-1">Haz clic en cualquier bloque del canvas para editar sus propiedades</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <p className="text-sm font-semibold">{BLOCK_LABELS[block.type]}</p>
          <p className="text-xs text-muted-foreground">Editar propiedades</p>
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

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        {block.type === 'header' && (
          <HeaderBlockEditor block={block} onChange={onChange} />
        )}
        {block.type === 'text' && (
          <TextBlockEditor block={block} onChange={onChange} />
        )}
        {block.type === 'image' && (
          <ImageBlockEditor block={block} onChange={onChange} />
        )}
        {block.type === 'button' && (
          <ButtonBlockEditor block={block} onChange={onChange} />
        )}
        {block.type === 'divider' && (
          <DividerBlockEditor block={block} onChange={onChange} />
        )}
        {block.type === 'spacer' && (
          <SpacerBlockEditor block={block} onChange={onChange} />
        )}
      </div>
    </div>
  )
}
