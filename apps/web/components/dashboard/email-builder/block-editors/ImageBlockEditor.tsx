'use client'

import { useState, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Loader2 } from 'lucide-react'
import type { ImageBlock } from '@/lib/email-blocks'

interface Props {
  block: ImageBlock
  onChange: (block: ImageBlock) => void
}

export function ImageBlockEditor({ block, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function update(partial: Partial<ImageBlock['props']>) {
    onChange({ ...block, props: { ...block.props, ...partial } })
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

  const widthPct = Math.min(100, Math.max(10, block.props.width))

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Imagen</Label>
        {block.props.src ? (
          <div className="space-y-2">
            <img
              src={block.props.src}
              alt={block.props.alt}
              className="w-full rounded border object-contain max-h-48"
            />
            <Button variant="outline" size="sm" className="w-full" onClick={() => update({ src: '' })}>
              Quitar imagen
            </Button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          >
            {uploading ? (
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Arrastra o haz clic para subir</p>
                <p className="text-xs text-muted-foreground/60">JPG, PNG, WebP · Máx 5 MB</p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>

      {/* Width slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">Ancho</Label>
          <span className="text-xs font-mono font-semibold bg-muted px-1.5 py-0.5 rounded">{widthPct}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={widthPct}
          onChange={e => update({ width: Number(e.target.value) })}
          className="w-full accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground/50 mt-1">
          <span>10%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        {/* Quick presets */}
        <div className="flex gap-1.5 mt-2">
          {[25, 50, 75, 100].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => update({ width: p })}
              className={`flex-1 text-xs py-1 rounded border transition-colors ${
                widthPct === p
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              }`}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      {/* Alt text */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Texto alternativo (alt)</Label>
        <Input
          value={block.props.alt}
          onChange={e => update({ alt: e.target.value })}
          placeholder="Descripción de la imagen"
        />
      </div>

      {/* Alignment */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Alineación</Label>
        <Select value={block.props.align} onValueChange={v => update({ align: v as ImageBlock['props']['align'] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Izquierda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="right">Derecha</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Link URL */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">URL de enlace (opcional)</Label>
        <Input
          value={block.props.linkUrl ?? ''}
          onChange={e => update({ linkUrl: e.target.value || undefined })}
          placeholder="https://..."
          type="url"
        />
      </div>
    </div>
  )
}
