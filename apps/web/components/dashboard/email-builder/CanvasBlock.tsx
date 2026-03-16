'use client'

import { useRef, useState, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { EmailBlock, HeaderBlock, TextBlock, ImageBlock, ButtonBlock, DividerBlock, SpacerBlock } from '@/lib/email-blocks'
import { cn } from '@/lib/utils'

interface Props {
  block: EmailBlock
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (block: EmailBlock) => void
}

// ── Visual previews per block type ────────────────────────────────────────────

function HeaderPreview({ block }: { block: HeaderBlock }) {
  return (
    <div className="px-6 py-5 rounded-t" style={{ background: block.props.bgColor }}>
      {block.props.subtext && (
        <p className="text-xs font-semibold mb-1 opacity-70 uppercase tracking-wider" style={{ color: block.props.textColor }}>
          {block.props.subtext}
        </p>
      )}
      <h2 className="text-xl font-bold leading-snug" style={{ color: block.props.textColor }}>
        {block.props.text}
      </h2>
    </div>
  )
}

function TextPreview({ block }: { block: TextBlock }) {
  const sizeClass = block.props.fontSize === 'sm' ? 'text-sm' : block.props.fontSize === 'lg' ? 'text-base' : 'text-sm'
  const paragraphs = block.props.content.split('\n').filter(p => p.trim())
  return (
    <div className="px-6 py-4 bg-white" style={{ textAlign: block.props.align }}>
      {paragraphs.slice(0, 3).map((p, i) => (
        <p key={i} className={cn(sizeClass, 'leading-relaxed mb-2 last:mb-0')} style={{ color: block.props.color }}>
          {p}
        </p>
      ))}
      {paragraphs.length > 3 && (
        <p className="text-xs text-muted-foreground italic">+{paragraphs.length - 3} párrafo(s) más...</p>
      )}
    </div>
  )
}

// ── Resizable Image Preview ────────────────────────────────────────────────────

function ImagePreview({ block, onUpdate }: { block: ImageBlock; onUpdate: (b: ImageBlock) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)
  const [liveWidth, setLiveWidth] = useState<number | null>(null)
  const [isDraggingHandle, setIsDraggingHandle] = useState(false)

  const startResize = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    if (!containerRef.current) return

    const containerWidth = containerRef.current.offsetWidth
    dragState.current = { startX: e.clientX, startWidth: block.props.width }
    setIsDraggingHandle(true)

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragState.current) return
      const deltaX = ev.clientX - dragState.current.startX
      // right handle → drag right = wider; left handle → drag right = narrower
      const sign = side === 'right' ? 1 : -1
      const deltaPct = (deltaX / containerWidth) * 100 * sign
      const raw = dragState.current.startWidth + deltaPct
      const clamped = Math.min(100, Math.max(10, Math.round(raw / 5) * 5))
      setLiveWidth(clamped)
    }

    const onMouseUp = () => {
      if (dragState.current && liveWidthRef.current !== null) {
        onUpdate({ ...block, props: { ...block.props, width: liveWidthRef.current } })
      }
      dragState.current = null
      setIsDraggingHandle(false)
      setLiveWidth(null)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [block, onUpdate])

  // Keep a ref to liveWidth so the mouseup closure can access the latest value
  const liveWidthRef = useRef<number | null>(null)
  liveWidthRef.current = liveWidth

  if (!block.props.src) {
    return (
      <div className="px-6 py-8 bg-white flex items-center justify-center">
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg w-full py-8 text-center">
          <p className="text-xs text-muted-foreground">Sin imagen — selecciona para subir</p>
        </div>
      </div>
    )
  }

  const displayWidth = liveWidth ?? block.props.width
  const widthPct = `${Math.min(100, Math.max(10, displayWidth))}%`
  const marginStyle = block.props.align === 'center'
    ? { marginLeft: 'auto', marginRight: 'auto' }
    : block.props.align === 'right'
      ? { marginLeft: 'auto' }
      : {}

  return (
    <div ref={containerRef} className="px-6 py-3 bg-white relative select-none">
      <div style={{ width: widthPct, ...marginStyle }} className="relative group/img">
        <img
          src={block.props.src}
          alt={block.props.alt}
          draggable={false}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          className={cn('rounded', isDraggingHandle ? 'pointer-events-none' : '')}
        />

        {/* Width badge shown while resizing */}
        {isDraggingHandle && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white text-xs font-mono px-2 py-1 rounded pointer-events-none z-20">
            {displayWidth}%
          </div>
        )}

        {/* Left resize handle */}
        <div
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => startResize(e, 'left')}
          className={cn(
            'absolute left-0 top-0 h-full w-3 flex items-center justify-center cursor-ew-resize z-10 transition-opacity',
            'opacity-0 group-hover/img:opacity-100',
            isDraggingHandle ? 'opacity-100' : ''
          )}
          title="Arrastrar para redimensionar"
        >
          <div className="w-1.5 h-10 rounded-full bg-primary shadow-md flex flex-col items-center justify-center gap-0.5">
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
          </div>
        </div>

        {/* Right resize handle */}
        <div
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => startResize(e, 'right')}
          className={cn(
            'absolute right-0 top-0 h-full w-3 flex items-center justify-center cursor-ew-resize z-10 transition-opacity',
            'opacity-0 group-hover/img:opacity-100',
            isDraggingHandle ? 'opacity-100' : ''
          )}
          title="Arrastrar para redimensionar"
        >
          <div className="w-1.5 h-10 rounded-full bg-primary shadow-md flex flex-col items-center justify-center gap-0.5">
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* Width indicator below image */}
      <div className={cn(
        'text-center mt-1 transition-opacity',
        isDraggingHandle ? 'opacity-100' : 'opacity-0'
      )}>
        <span className="text-xs text-primary font-semibold">{displayWidth}%</span>
      </div>
    </div>
  )
}

function ButtonPreview({ block }: { block: ButtonBlock }) {
  const sizeClass = block.props.size === 'sm' ? 'px-4 py-2 text-xs' : block.props.size === 'lg' ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm'
  const radiusClass = block.props.borderRadius === 'none' ? 'rounded-none' : block.props.borderRadius === 'full' ? 'rounded-full' : 'rounded'
  const alignClass = block.props.align === 'center' ? 'justify-center' : block.props.align === 'right' ? 'justify-end' : 'justify-start'
  return (
    <div className={cn('px-6 py-4 bg-white flex', alignClass)}>
      <span
        className={cn('inline-block font-semibold cursor-default', sizeClass, radiusClass)}
        style={{ background: block.props.bgColor, color: block.props.textColor }}
      >
        {block.props.text}
      </span>
    </div>
  )
}

function DividerPreview({ block }: { block: DividerBlock }) {
  return (
    <div className="px-6 bg-white" style={{ paddingTop: block.props.marginTop, paddingBottom: block.props.marginBottom }}>
      <div style={{ height: block.props.thickness, background: block.props.color }} />
    </div>
  )
}

function SpacerPreview({ block }: { block: SpacerBlock }) {
  return (
    <div className="bg-white flex items-center justify-center" style={{ height: Math.max(block.props.height, 20) }}>
      <span className="text-xs text-muted-foreground/50 select-none">↕ {block.props.height}px</span>
    </div>
  )
}

// ── Main CanvasBlock ───────────────────────────────────────────────────────────

export function CanvasBlock({ block, isSelected, onSelect, onDelete, onUpdate }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative border-2 rounded transition-all',
        isDragging ? 'opacity-40 z-50' : 'opacity-100',
        isSelected
          ? 'border-primary shadow-md'
          : 'border-transparent hover:border-primary/40',
      )}
      onClick={() => onSelect(block.id)}
    >
      {/* Action chrome */}
      <div className={cn(
        'absolute -top-3 right-1 flex items-center gap-1 z-10 transition-opacity',
        isSelected || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        <button
          {...attributes}
          {...listeners}
          className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 cursor-grab active:cursor-grabbing shadow-sm"
          onClick={e => e.stopPropagation()}
          title="Arrastrar"
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <button
          className="bg-background border rounded px-1.5 py-0.5 shadow-sm hover:bg-muted"
          onClick={e => { e.stopPropagation(); onSelect(block.id) }}
          title="Editar"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          className="bg-background border rounded px-1.5 py-0.5 shadow-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          onClick={e => { e.stopPropagation(); onDelete(block.id) }}
          title="Eliminar"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Block content */}
      {block.type === 'image' ? (
        <ImagePreview
          block={block}
          onUpdate={b => onUpdate(b)}
        />
      ) : (
        <BlockPreview block={block} />
      )}
    </div>
  )
}

function BlockPreview({ block }: { block: EmailBlock }) {
  switch (block.type) {
    case 'header':  return <HeaderPreview block={block as HeaderBlock} />
    case 'text':    return <TextPreview block={block as TextBlock} />
    case 'button':  return <ButtonPreview block={block as ButtonBlock} />
    case 'divider': return <DividerPreview block={block as DividerBlock} />
    case 'spacer':  return <SpacerPreview block={block as SpacerBlock} />
    default:        return null
  }
}
