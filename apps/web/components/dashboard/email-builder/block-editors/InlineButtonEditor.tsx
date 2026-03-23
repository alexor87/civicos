'use client'

import { cn } from '@/lib/utils'
import type { ButtonBlock, EmailBlock } from '@/lib/email-blocks'

interface Props {
  block: ButtonBlock
  onUpdate: (block: EmailBlock) => void
}

export function InlineButtonEditor({ block, onUpdate }: Props) {
  function update(partial: Partial<ButtonBlock['props']>) {
    onUpdate({ ...block, props: { ...block.props, ...partial } })
  }

  const sizeClass = block.props.size === 'sm'
    ? 'px-4 py-2 text-xs'
    : block.props.size === 'lg'
      ? 'px-8 py-4 text-base'
      : 'px-6 py-3 text-sm'

  const radiusClass = block.props.borderRadius === 'none'
    ? 'rounded-none'
    : block.props.borderRadius === 'full'
      ? 'rounded-full'
      : 'rounded'

  const alignClass = block.props.align === 'center'
    ? 'justify-center'
    : block.props.align === 'right'
      ? 'justify-end'
      : 'justify-start'

  return (
    <div className="rounded-xl overflow-hidden" data-testid="inline-button-editor">
      {/* Toolbar */}
      <div
        className="sticky top-0 z-20 flex flex-wrap items-center gap-2 px-3 py-1.5 bg-white border-b border-slate-100 shadow-sm"
        data-testid="inline-button-toolbar"
      >
        {/* URL */}
        <input
          data-testid="inline-button-url-input"
          type="url"
          value={block.props.url}
          onChange={e => update({ url: e.target.value })}
          placeholder="https://..."
          className="h-7 text-xs w-40 border border-slate-200 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

        {/* BgColor */}
        <div className="flex items-center gap-1" title="Color del botón">
          <input
            data-testid="inline-button-bg-color"
            type="color"
            value={block.props.bgColor}
            onChange={e => update({ bgColor: e.target.value })}
            className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0"
          />
          <span className="text-xs text-slate-500">Fondo</span>
        </div>

        {/* TextColor */}
        <div className="flex items-center gap-1" title="Color del texto">
          <input
            data-testid="inline-button-text-color"
            type="color"
            value={block.props.textColor}
            onChange={e => update({ textColor: e.target.value })}
            className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0"
          />
          <span className="text-xs text-slate-500">Texto</span>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

        {/* Size */}
        <select
          data-testid="inline-button-size-select"
          value={block.props.size}
          onChange={e => update({ size: e.target.value as ButtonBlock['props']['size'] })}
          title="Tamaño"
          className="h-7 w-14 text-xs font-medium text-slate-700 border border-slate-200 rounded-md bg-white px-1 cursor-pointer focus:outline-none appearance-none text-center"
        >
          <option value="sm">S</option>
          <option value="md">M</option>
          <option value="lg">L</option>
        </select>

        {/* Border radius */}
        <select
          data-testid="inline-button-radius-select"
          value={block.props.borderRadius}
          onChange={e => update({ borderRadius: e.target.value as ButtonBlock['props']['borderRadius'] })}
          title="Radio de borde"
          className="h-7 w-20 text-xs font-medium text-slate-700 border border-slate-200 rounded-md bg-white px-1 cursor-pointer focus:outline-none appearance-none text-center"
        >
          <option value="none">Cuadrado</option>
          <option value="sm">Redondeado</option>
          <option value="full">Píldora</option>
        </select>

        {/* Align */}
        <select
          data-testid="inline-button-align-select"
          value={block.props.align}
          onChange={e => update({ align: e.target.value as ButtonBlock['props']['align'] })}
          title="Alineación"
          className="h-7 w-20 text-xs font-medium text-slate-700 border border-slate-200 rounded-md bg-white px-1 cursor-pointer focus:outline-none appearance-none text-center"
        >
          <option value="left">← Izq.</option>
          <option value="center">↔ Centro</option>
          <option value="right">→ Der.</option>
        </select>
      </div>

      {/* Editable content — same visual as ButtonPreview */}
      <div
        data-testid="inline-button-content"
        className={cn('px-6 py-4 bg-white flex', alignClass)}
      >
        <input
          data-testid="inline-button-text-input"
          value={block.props.text}
          onChange={e => update({ text: e.target.value })}
          placeholder="Texto del botón"
          style={{ background: block.props.bgColor, color: block.props.textColor }}
          className={cn('font-semibold border-none outline-none text-center cursor-text', sizeClass, radiusClass)}
        />
      </div>
    </div>
  )
}
