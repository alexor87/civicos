'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import type { ImageBlock, EmailBlock } from '@/lib/email-blocks'

// Re-implements the ImagePreview resize logic inline (same code as CanvasBlock's ImagePreview)
function ResizableImage({
  block,
  onUpdate,
}: {
  block: ImageBlock
  onUpdate: (b: ImageBlock) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)
  const [liveWidth, setLiveWidth] = useState<number | null>(null)
  const [isDraggingHandle, setIsDraggingHandle] = useState(false)
  const liveWidthRef = useRef<number | null>(null)
  liveWidthRef.current = liveWidth

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

  if (!block.props.src) {
    return (
      <div className="px-6 py-8 bg-white flex items-center justify-center">
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg w-full py-8 text-center">
          <p className="text-xs text-muted-foreground">Sin imagen — usa "Subir" arriba</p>
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
          className={isDraggingHandle ? 'rounded pointer-events-none' : 'rounded'}
        />
        {isDraggingHandle && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white text-xs font-mono px-2 py-1 rounded pointer-events-none z-20">
            {displayWidth}%
          </div>
        )}
        {/* Left handle */}
        <div
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => startResize(e, 'left')}
          className={`absolute left-0 top-0 h-full w-3 flex items-center justify-center cursor-ew-resize z-10 transition-opacity ${isDraggingHandle ? 'opacity-100' : 'opacity-0 group-hover/img:opacity-100'}`}
          title="Arrastrar para redimensionar"
        >
          <div className="w-1.5 h-10 rounded-full bg-primary shadow-md flex flex-col items-center justify-center gap-0.5">
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
          </div>
        </div>
        {/* Right handle */}
        <div
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => startResize(e, 'right')}
          className={`absolute right-0 top-0 h-full w-3 flex items-center justify-center cursor-ew-resize z-10 transition-opacity ${isDraggingHandle ? 'opacity-100' : 'opacity-0 group-hover/img:opacity-100'}`}
          title="Arrastrar para redimensionar"
        >
          <div className="w-1.5 h-10 rounded-full bg-primary shadow-md flex flex-col items-center justify-center gap-0.5">
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
            <div className="w-0.5 h-0.5 rounded-full bg-white" />
          </div>
        </div>
      </div>
      <div className={`text-center mt-1 transition-opacity ${isDraggingHandle ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-xs text-primary font-semibold">{displayWidth}%</span>
      </div>
    </div>
  )
}

interface Props {
  block: ImageBlock
  onUpdate: (block: EmailBlock) => void
}

export function InlineImageEditor({ block, onUpdate }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function update(partial: Partial<ImageBlock['props']>) {
    onUpdate({ ...block, props: { ...block.props, ...partial } })
  }

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/image', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Error al subir imagen')
      const { url } = await res.json()
      update({ src: url })
    } catch {
      setError('No se pudo subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl overflow-hidden" data-testid="inline-image-editor">
      {/* Toolbar */}
      <div
        className="sticky top-0 z-20 flex flex-wrap items-center gap-2 px-3 py-1.5 bg-white border-b border-slate-100 shadow-sm"
        data-testid="inline-image-toolbar"
      >
        {/* Upload button */}
        <button
          type="button"
          data-testid="inline-image-upload-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="h-7 flex items-center gap-1 text-xs font-medium text-slate-700 border border-slate-200 rounded-md bg-white px-2 cursor-pointer hover:bg-slate-50 disabled:opacity-50"
        >
          {uploading
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Upload className="h-3 w-3" />}
          {uploading ? 'Subiendo…' : 'Subir imagen'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {block.props.src && (
          <button
            type="button"
            data-testid="inline-image-remove-btn"
            onClick={() => update({ src: '' })}
            className="h-7 text-xs text-red-500 border border-red-200 rounded-md px-2 hover:bg-red-50"
          >
            Quitar
          </button>
        )}

        <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

        {/* Alt text */}
        <input
          data-testid="inline-image-alt-input"
          type="text"
          value={block.props.alt}
          onChange={e => update({ alt: e.target.value })}
          placeholder="Texto alt..."
          className="h-7 text-xs w-28 border border-slate-200 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        {/* Align */}
        <select
          data-testid="inline-image-align-select"
          value={block.props.align}
          onChange={e => update({ align: e.target.value as ImageBlock['props']['align'] })}
          title="Alineación"
          className="h-7 w-20 text-xs font-medium text-slate-700 border border-slate-200 rounded-md bg-white px-1 cursor-pointer focus:outline-none appearance-none text-center"
        >
          <option value="left">← Izq.</option>
          <option value="center">↔ Centro</option>
          <option value="right">→ Der.</option>
        </select>

        <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

        {/* Link URL */}
        <input
          data-testid="inline-image-link-input"
          type="url"
          value={block.props.linkUrl ?? ''}
          onChange={e => update({ linkUrl: e.target.value || undefined })}
          placeholder="URL enlace..."
          className="h-7 text-xs w-32 border border-slate-200 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive px-3 py-1 bg-destructive/5">{error}</p>
      )}

      {/* Resizable image area */}
      <ResizableImage block={block} onUpdate={b => onUpdate(b)} />
    </div>
  )
}
