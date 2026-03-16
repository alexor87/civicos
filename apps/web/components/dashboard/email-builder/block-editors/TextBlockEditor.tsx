'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TextBlock } from '@/lib/email-blocks'

interface Props {
  block: TextBlock
  onChange: (block: TextBlock) => void
}

export function TextBlockEditor({ block, onChange }: Props) {
  function update(partial: Partial<TextBlock['props']>) {
    onChange({ ...block, props: { ...block.props, ...partial } })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Contenido</Label>
        <Textarea
          value={block.props.content}
          onChange={e => update({ content: e.target.value })}
          placeholder="Escribe tu texto aquí..."
          rows={6}
          className="resize-y text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">Usa saltos de línea para separar párrafos</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Tamaño</Label>
          <Select value={block.props.fontSize} onValueChange={v => update({ fontSize: v as TextBlock['props']['fontSize'] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Pequeño (14px)</SelectItem>
              <SelectItem value="md">Normal (16px)</SelectItem>
              <SelectItem value="lg">Grande (18px)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Alineación</Label>
          <Select value={block.props.align} onValueChange={v => update({ align: v as TextBlock['props']['align'] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Izquierda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Derecha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Color de texto</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={block.props.color}
            onChange={e => update({ color: e.target.value })}
            className="w-8 h-8 rounded border cursor-pointer"
          />
          <Input
            value={block.props.color}
            onChange={e => update({ color: e.target.value })}
            className="font-mono text-xs"
          />
        </div>
      </div>
    </div>
  )
}
