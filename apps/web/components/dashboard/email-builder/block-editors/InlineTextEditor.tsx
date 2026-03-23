'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { useCallback, useState, useRef } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Link2Off, RemoveFormatting,
  Undo2, Redo2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { TextBlock, EmailBlock } from '@/lib/email-blocks'
import { resolveFontSize } from '@/lib/email-blocks'
import { cn } from '@/lib/utils'

// ── Custom FontSize extension (replaces @tiptap/extension-font-size v2) ────────

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

// ── Toolbar button ─────────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
  'data-testid': testId,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
  'data-testid'?: string
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      title={title}
      disabled={disabled}
      onMouseDown={e => { if (disabled) return; e.preventDefault(); onClick() }}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors',
        active && 'bg-primary/10 text-primary font-semibold',
        disabled && 'opacity-30 cursor-not-allowed pointer-events-none'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 60, 72]

function normaliseFontSize(v: string): string {
  const map: Record<string, string> = { sm: '14', md: '16', lg: '18' }
  return map[v] ?? v
}

// ── Link dialog ────────────────────────────────────────────────────────────────

function LinkDialog({
  current,
  onSave,
  onRemove,
  onCancel,
}: {
  current: string
  onSave: (url: string) => void
  onRemove: () => void
  onCancel: () => void
}) {
  const [url, setUrl] = useState(current || 'https://')
  return (
    <div className="flex items-center gap-1.5">
      <Input
        data-testid="inline-link-url-input"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onSave(url) }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="https://..."
        className="h-7 text-xs w-44"
        autoFocus
      />
      <button
        type="button"
        data-testid="inline-link-save-btn"
        onMouseDown={e => { e.preventDefault(); onSave(url) }}
        className="text-xs font-semibold text-primary hover:underline px-1"
      >
        OK
      </button>
      {current && (
        <button
          type="button"
          data-testid="inline-link-remove-btn"
          onMouseDown={e => { e.preventDefault(); onRemove() }}
          className="text-xs text-red-500 hover:underline px-1"
        >
          Quitar
        </button>
      )}
      <button
        type="button"
        onMouseDown={e => { e.preventDefault(); onCancel() }}
        className="text-xs text-slate-400 hover:text-slate-600 px-1"
      >
        ✕
      </button>
    </div>
  )
}

// ── Main inline editor ─────────────────────────────────────────────────────────

interface Props {
  block: TextBlock
  onUpdate: (block: EmailBlock) => void
}

export function InlineTextEditor({ block, onUpdate }: Props) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const blockRef = useRef(block)
  blockRef.current = block

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontSize,
      Color,
    ],
    content: (() => {
      const c = block.props.content
      if (!c) return '<p></p>'
      if (c.trim().startsWith('<')) return c
      return c.split('\n').filter(l => l.trim()).map(l => `<p>${l}</p>`).join('') || '<p></p>'
    })(),
    onUpdate: ({ editor }) => {
      onUpdate({ ...blockRef.current, props: { ...blockRef.current.props, content: editor.getHTML() } })
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[80px] leading-relaxed',
        'data-testid': 'inline-tiptap-editor',
      },
    },
  })

  const handleLinkSave = useCallback((url: string) => {
    if (!editor) return
    if (!url || url === 'https://') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
    setShowLinkDialog(false)
  }, [editor])

  const handleLinkRemove = useCallback(() => {
    editor?.chain().focus().unsetLink().run()
    setShowLinkDialog(false)
  }, [editor])

  function updateBlock(partial: Partial<TextBlock['props']>) {
    onUpdate({ ...block, props: { ...block.props, ...partial } })
  }

  const currentLink = editor?.getAttributes('link').href as string | undefined

  // Current selection's font size (falls back to block default)
  const selectionFontSize =
    editor?.getAttributes('textStyle').fontSize?.replace('px', '') ??
    normaliseFontSize(block.props.fontSize)

  // Current selection's color (falls back to block default)
  const selectionColor =
    (editor?.getAttributes('textStyle').color as string | undefined) ??
    block.props.color

  return (
    <div
      className="rounded-xl overflow-hidden"
      data-testid="inline-text-editor"
    >
      {/* Floating toolbar — sticky inside the block */}
      <div
        className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-white border-b border-slate-100 shadow-sm"
        data-testid="inline-toolbar"
      >
        {/* Font size — per selection */}
        <select
          data-testid="inline-font-size-select"
          value={selectionFontSize}
          onChange={e => {
            editor?.chain().focus().setFontSize(e.target.value + 'px').run()
          }}
          title="Tamaño de fuente"
          className="h-7 w-14 text-xs font-medium text-slate-700 border border-slate-200 rounded-md bg-white px-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none text-center"
        >
          {FONT_SIZES.map(s => (
            <option key={s} value={String(s)}>{s}</option>
          ))}
        </select>

        <ToolbarDivider />

        {/* Undo / Redo */}
        <ToolbarBtn
          data-testid="inline-toolbar-undo"
          disabled={!editor?.can().undo()}
          onClick={() => editor?.commands.undo()}
          title="Deshacer (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          data-testid="inline-toolbar-redo"
          disabled={!editor?.can().redo()}
          onClick={() => editor?.commands.redo()}
          title="Rehacer (Ctrl+Y)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Text format */}
        <ToolbarBtn
          data-testid="inline-toolbar-bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
          title="Negrita (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          data-testid="inline-toolbar-italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          data-testid="inline-toolbar-underline"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          active={editor?.isActive('underline')}
          title="Subrayado (Ctrl+U)"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          data-testid="inline-toolbar-strike"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          active={editor?.isActive('strike')}
          title="Tachado"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarBtn
          data-testid="inline-toolbar-align-left"
          onClick={() => { editor?.chain().focus().setTextAlign('left').run(); updateBlock({ align: 'left' }) }}
          active={editor?.isActive({ textAlign: 'left' })}
          title="Izquierda"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          data-testid="inline-toolbar-align-center"
          onClick={() => { editor?.chain().focus().setTextAlign('center').run(); updateBlock({ align: 'center' }) }}
          active={editor?.isActive({ textAlign: 'center' })}
          title="Centrar"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          data-testid="inline-toolbar-align-right"
          onClick={() => { editor?.chain().focus().setTextAlign('right').run(); updateBlock({ align: 'right' }) }}
          active={editor?.isActive({ textAlign: 'right' })}
          title="Derecha"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          data-testid="inline-toolbar-align-justify"
          onClick={() => { editor?.chain().focus().setTextAlign('justify').run(); updateBlock({ align: 'right' }) }}
          active={editor?.isActive({ textAlign: 'justify' })}
          title="Justificar"
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarBtn
          data-testid="inline-toolbar-bullet-list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList')}
          title="Lista de viñetas"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          data-testid="inline-toolbar-ordered-list"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Link */}
        <ToolbarBtn
          data-testid="inline-toolbar-link"
          onClick={() => setShowLinkDialog(v => !v)}
          active={editor?.isActive('link') || showLinkDialog}
          title="Insertar enlace"
        >
          {editor?.isActive('link') ? (
            <Link2Off className="h-3.5 w-3.5" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
        </ToolbarBtn>

        {/* Clear formatting */}
        <ToolbarBtn
          data-testid="inline-toolbar-clear"
          onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Limpiar formato"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Color de texto — per selection */}
        <div className="flex items-center gap-1" title="Color de texto">
          <input
            data-testid="inline-color-picker"
            type="color"
            value={selectionColor}
            onChange={e => {
              editor?.chain().focus().setColor(e.target.value).run()
            }}
            className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0"
          />
        </div>
      </div>

      {/* Link dialog */}
      {showLinkDialog && (
        <div className="px-2 py-1.5 border-b border-slate-100 bg-slate-50/60" data-testid="inline-link-dialog">
          <LinkDialog
            current={currentLink ?? ''}
            onSave={handleLinkSave}
            onRemove={handleLinkRemove}
            onCancel={() => setShowLinkDialog(false)}
          />
        </div>
      )}

      {/* Editor area */}
      <div
        className="p-4 bg-white min-h-[80px] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
        style={{ fontSize: resolveFontSize(block.props.fontSize), color: block.props.color }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
