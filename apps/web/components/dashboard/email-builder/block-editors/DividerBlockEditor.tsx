'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DividerBlock } from '@/lib/email-blocks'

interface Props {
  block: DividerBlock
  onChange: (block: DividerBlock) => void
}

export function DividerBlockEditor({ block, onChange }: Props) {
  function update(partial: Partial<DividerBlock['props']>) {
    onChange({ ...block, props: { ...block.props, ...partial } })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Color</Label>
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

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Grosor</Label>
        <Select
          value={String(block.props.thickness)}
          onValueChange={v => update({ thickness: Number(v) as 1 | 2 })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1px</SelectItem>
            <SelectItem value="2">2px</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Margen superior (px)</Label>
          <Input
            type="number"
            min={0}
            max={80}
            value={block.props.marginTop}
            onChange={e => update({ marginTop: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Margen inferior (px)</Label>
          <Input
            type="number"
            min={0}
            max={80}
            value={block.props.marginBottom}
            onChange={e => update({ marginBottom: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}
