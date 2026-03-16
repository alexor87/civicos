'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { MousePointerClick } from 'lucide-react'
import type { EmailBlock } from '@/lib/email-blocks'
import { CanvasBlock } from './CanvasBlock'
import { cn } from '@/lib/utils'

export const CANVAS_DROP_ID = 'canvas-drop-zone'

interface Props {
  blocks: EmailBlock[]
  selectedBlockId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (block: EmailBlock) => void
}

export function BuilderCanvas({ blocks, selectedBlockId, onSelect, onDelete, onUpdate }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROP_ID })

  return (
    <div className="flex-1 overflow-y-auto bg-[#f6f7f8] p-6">
      <div className="max-w-[600px] mx-auto">
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.length === 0 ? (
            <div ref={setNodeRef}>
              <EmptyCanvas isOver={isOver} />
            </div>
          ) : (
            <div
              ref={setNodeRef}
              className={cn(
                'flex flex-col gap-0.5 rounded-lg transition-all',
                isOver ? 'ring-2 ring-primary/40 ring-offset-2' : ''
              )}
            >
              {blocks.map(block => (
                <CanvasBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
}

function EmptyCanvas({ isOver }: { isOver: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-24 px-6 text-center border-2 border-dashed rounded-lg transition-all',
        isOver
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-muted-foreground/25 bg-white'
      )}
    >
      <MousePointerClick className={cn('h-10 w-10 mb-4', isOver ? 'text-primary' : 'text-muted-foreground/40')} />
      <p className={cn('text-base font-medium', isOver ? 'text-primary' : 'text-muted-foreground')}>
        {isOver ? 'Suelta para agregar' : 'Arrastra un bloque aquí'}
      </p>
      <p className="text-sm text-muted-foreground/70 mt-1">
        Elige un elemento del panel izquierdo para comenzar a diseñar tu correo
      </p>
    </div>
  )
}
