'use client'

import type { SpacerBlock, EmailBlock } from '@/lib/email-blocks'

interface Props {
  block: SpacerBlock
  onUpdate: (block: EmailBlock) => void
}

export function InlineSpacerEditor({ block, onUpdate }: Props) {
  function update(partial: Partial<SpacerBlock['props']>) {
    onUpdate({ ...block, props: { ...block.props, ...partial } })
  }

  function setHeight(val: number) {
    update({ height: Math.min(120, Math.max(8, val)) })
  }

  return (
    <div className="rounded-xl overflow-hidden" data-testid="inline-spacer-editor">
      {/* Toolbar */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-3 py-1.5 bg-white border-b border-slate-100 shadow-sm"
        data-testid="inline-spacer-toolbar"
      >
        <span className="text-xs text-slate-500 flex-shrink-0">Alto</span>

        <input
          data-testid="inline-spacer-height-range"
          type="range"
          min={8}
          max={120}
          step={8}
          value={block.props.height}
          onChange={e => setHeight(Number(e.target.value))}
          className="flex-1 accent-primary cursor-pointer"
        />

        <input
          data-testid="inline-spacer-height-input"
          type="number"
          min={8}
          max={120}
          step={8}
          value={block.props.height}
          onChange={e => setHeight(Number(e.target.value))}
          className="h-7 w-14 text-xs border border-slate-200 rounded-md px-1 text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-xs text-slate-400">px</span>
      </div>

      {/* Live preview */}
      <div
        data-testid="inline-spacer-preview"
        className="bg-white flex items-center justify-center"
        style={{ height: Math.max(block.props.height, 20) }}
      >
        <span className="text-xs text-muted-foreground/50 select-none">↕ {block.props.height}px</span>
      </div>
    </div>
  )
}
