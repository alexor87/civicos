'use client'

import type { DividerBlock, EmailBlock } from '@/lib/email-blocks'

interface Props {
  block: DividerBlock
  onUpdate: (block: EmailBlock) => void
}

export function InlineDividerEditor({ block, onUpdate }: Props) {
  function update(partial: Partial<DividerBlock['props']>) {
    onUpdate({ ...block, props: { ...block.props, ...partial } })
  }

  return (
    <div className="rounded-xl overflow-hidden" data-testid="inline-divider-editor">
      {/* Toolbar */}
      <div
        className="sticky top-0 z-20 flex flex-wrap items-center gap-2 px-3 py-1.5 bg-white border-b border-slate-100 shadow-sm"
        data-testid="inline-divider-toolbar"
      >
        {/* Color */}
        <div className="flex items-center gap-1" title="Color de línea">
          <input
            data-testid="inline-divider-color"
            type="color"
            value={block.props.color}
            onChange={e => update({ color: e.target.value })}
            className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0"
          />
          <span className="text-xs text-slate-500">Color</span>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

        {/* Thickness */}
        <select
          data-testid="inline-divider-thickness"
          value={block.props.thickness}
          onChange={e => update({ thickness: Number(e.target.value) as 1 | 2 })}
          title="Grosor"
          className="h-7 w-16 text-xs font-medium text-slate-700 border border-slate-200 rounded-md bg-white px-1 cursor-pointer focus:outline-none appearance-none text-center"
        >
          <option value={1}>1px</option>
          <option value={2}>2px</option>
        </select>

        <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

        {/* MarginTop */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">↑</span>
          <input
            data-testid="inline-divider-margin-top"
            type="number"
            min={0}
            max={80}
            value={block.props.marginTop}
            onChange={e => update({ marginTop: Math.min(80, Math.max(0, Number(e.target.value))) })}
            className="h-7 w-14 text-xs border border-slate-200 rounded-md px-1 text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* MarginBottom */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">↓</span>
          <input
            data-testid="inline-divider-margin-bottom"
            type="number"
            min={0}
            max={80}
            value={block.props.marginBottom}
            onChange={e => update({ marginBottom: Math.min(80, Math.max(0, Number(e.target.value))) })}
            className="h-7 w-14 text-xs border border-slate-200 rounded-md px-1 text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Live preview of the divider */}
      <div
        data-testid="inline-divider-preview"
        className="bg-white px-6"
        style={{ paddingTop: block.props.marginTop, paddingBottom: block.props.marginBottom }}
      >
        <div style={{ height: block.props.thickness, background: block.props.color }} />
      </div>
    </div>
  )
}
