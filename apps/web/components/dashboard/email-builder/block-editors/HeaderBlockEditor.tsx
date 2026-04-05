'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { HeaderBlock } from '@/lib/email-blocks'

interface Props {
  block: HeaderBlock
  onChange: (block: HeaderBlock) => void
}

export function HeaderBlockEditor({ block, onChange }: Props) {
  function update(partial: Partial<HeaderBlock['props']>) {
    onChange({ ...block, props: { ...block.props, ...partial } })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Titular</Label>
        <Input
          value={block.props.text}
          onChange={e => update({ text: e.target.value })}
          placeholder="Tu titular aquí"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Subtítulo (opcional)</Label>
        <Input
          value={block.props.subtext ?? ''}
          onChange={e => update({ subtext: e.target.value || undefined })}
          placeholder="Scrutix · Campaña"
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

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Padding</Label>
        <Select value={block.props.padding} onValueChange={v => update({ padding: v as HeaderBlock['props']['padding'] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Pequeño</SelectItem>
            <SelectItem value="md">Mediano</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
