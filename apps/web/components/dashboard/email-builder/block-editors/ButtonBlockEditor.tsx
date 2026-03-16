'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ButtonBlock } from '@/lib/email-blocks'

interface Props {
  block: ButtonBlock
  onChange: (block: ButtonBlock) => void
}

export function ButtonBlockEditor({ block, onChange }: Props) {
  function update(partial: Partial<ButtonBlock['props']>) {
    onChange({ ...block, props: { ...block.props, ...partial } })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Texto del botón</Label>
        <Input
          value={block.props.text}
          onChange={e => update({ text: e.target.value })}
          placeholder="Confirmar asistencia"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">URL de destino</Label>
        <Input
          value={block.props.url}
          onChange={e => update({ url: e.target.value })}
          placeholder="https://..."
          type="url"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Color de fondo</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={block.props.bgColor}
              onChange={e => update({ bgColor: e.target.value })}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <Input
              value={block.props.bgColor}
              onChange={e => update({ bgColor: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Color de texto</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={block.props.textColor}
              onChange={e => update({ textColor: e.target.value })}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <Input
              value={block.props.textColor}
              onChange={e => update({ textColor: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Tamaño</Label>
          <Select value={block.props.size} onValueChange={v => update({ size: v as ButtonBlock['props']['size'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Pequeño</SelectItem>
              <SelectItem value="md">Mediano</SelectItem>
              <SelectItem value="lg">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Bordes</Label>
          <Select value={block.props.borderRadius} onValueChange={v => update({ borderRadius: v as ButtonBlock['props']['borderRadius'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Cuadrado</SelectItem>
              <SelectItem value="sm">Redondeado</SelectItem>
              <SelectItem value="full">Píldora</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Alineación</Label>
        <Select value={block.props.align} onValueChange={v => update({ align: v as ButtonBlock['props']['align'] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Izquierda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="right">Derecha</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
