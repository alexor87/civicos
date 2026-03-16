'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { SpacerBlock } from '@/lib/email-blocks'

interface Props {
  block: SpacerBlock
  onChange: (block: SpacerBlock) => void
}

export function SpacerBlockEditor({ block, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Alto (px)</Label>
        <Input
          type="number"
          min={8}
          max={120}
          step={8}
          value={block.props.height}
          onChange={e => onChange({ ...block, props: { height: Number(e.target.value) } })}
        />
        <p className="text-xs text-muted-foreground mt-1">Entre 8 y 120 px</p>
      </div>

      <div className="flex items-center justify-center bg-muted/30 rounded border-2 border-dashed" style={{ height: Math.max(block.props.height, 24) }}>
        <span className="text-xs text-muted-foreground">{block.props.height}px</span>
      </div>
    </div>
  )
}
