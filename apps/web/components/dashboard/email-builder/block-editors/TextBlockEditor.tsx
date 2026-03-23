'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { useCallback, useState } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Link2Off, RemoveFormatting,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { TextBlock } from '@/lib/email-blocks'
import { cn } from '@/lib/utils'

interface Props {
  block: TextBlock
  onChange: (block: TextBlock) => void
}

// ── Toolbar button ─────────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
  'data-testid': testId,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
  'data-testid'?: string
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      title={title}
      onClick={onClick}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors',
        active && 'bg-primary/10 text-primary font-semibold'
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

// Normalise legacy 'sm'/'md'/'lg' values to numeric strings
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
        data-testid="link-url-input"
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
        data-testid="link-save-btn"
        onClick={() => onSave(url)}
        className="text-xs font-semibold text-primary hover:underline px-1"
      >
        OK
      </button>
      {current && (
        <button
          type="button"
          data-testid="link-remove-btn"
          onClick={onRemove}
          className="text-xs text-red-500 hover:underline px-1"
        >
          Quitar
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-slate-400 hover:text-slate-600 px-1"
      >
        ✕
      </button>
    </div>
  )
}

// ── Main editor ────────────────────────────────────────────────────────────────

export function TextBlockEditor({ block, onChange }: Props) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
    ],
    content: block.props.content || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange({ ...block, props: { ...block.props, content: editor.getHTML() } })
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[120px] text-sm text-slate-800 leading-relaxed',
        'data-testid': 'tiptap-editor',
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

  function update(partial: Partial<TextBlock['props']>) {
    onChange({ ...block, props: { ...block.props, ...partial } })
  }

  const currentLink = editor?.getAttributes('link').href as string | undefined

  return (
    <div className="space-y-3">
      {/* Rich text editor */}
      <div>
        <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Contenido</Label>

        <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 shadow-sm">

          {/* Toolbar */}
          <div
            className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-slate-100 bg-white"
            data-testid="rich-text-toolbar"
          >
            {/* Font size dropdown */}
            <select
              data-testid="font-size-select"
              value={normaliseFontSize(block.props.fontSize)}
              onChange={e => update({ fontSize: e.target.value })}
              title="Tamaño de fuente"
              className="h-7 w-14 text-xs font-medium text-slate-700 border border-slate-200 rounded-md bg-white px-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none text-center"
            >
              {FONT_SIZES.map(s => (
                <option key={s} value={String(s)}>{s}</option>
              ))}
            </select>

            <ToolbarDivider />

            {/* Text format */}
            <ToolbarBtn
              data-testid="toolbar-bold"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive('bold')}
              title="Negrita (Ctrl+B)"
            >
              <Bold className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              data-testid="toolbar-italic"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive('italic')}
              title="Cursiva (Ctrl+I)"
            >
              <Italic className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              data-testid="toolbar-underline"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              active={editor?.isActive('underline')}
              title="Subrayado (Ctrl+U)"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              data-testid="toolbar-strike"
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              active={editor?.isActive('strike')}
              title="Tachado"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolbarBtn>

            <ToolbarDivider />

            {/* Alignment */}
            <ToolbarBtn
              data-testid="toolbar-align-left"
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              active={editor?.isActive({ textAlign: 'left' })}
              title="Izquierda"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              data-testid="toolbar-align-center"
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              active={editor?.isActive({ textAlign: 'center' })}
              title="Centrar"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              data-testid="toolbar-align-right"
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              active={editor?.isActive({ textAlign: 'right' })}
              title="Derecha"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              data-testid="toolbar-align-justify"
              onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
              active={editor?.isActive({ textAlign: 'justify' })}
              title="Justificar"
            >
              <AlignJustify className="h-3.5 w-3.5" />
            </ToolbarBtn>

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarBtn
              data-testid="toolbar-bullet-list"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
              title="Lista de viñetas"
            >
              <List className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              data-testid="toolbar-ordered-list"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
              title="Lista numerada"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarBtn>

            <ToolbarDivider />

            {/* Link */}
            <ToolbarBtn
              data-testid="toolbar-link"
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
              data-testid="toolbar-clear"
              onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
              title="Limpiar formato"
            >
              <RemoveFormatting className="h-3.5 w-3.5" />
            </ToolbarBtn>
          </div>

          {/* Link dialog (inline below toolbar) */}
          {showLinkDialog && (
            <div className="px-2 py-1.5 border-b border-slate-100 bg-slate-50/60" data-testid="link-dialog">
              <LinkDialog
                current={currentLink ?? ''}
                onSave={handleLinkSave}
                onRemove={handleLinkRemove}
                onCancel={() => setShowLinkDialog(false)}
              />
            </div>
          )}

          {/* Editor area */}
          <div className="p-3 bg-white">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Color de texto */}
      <div>
        <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Color de texto</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={block.props.color}
            onChange={e => update({ color: e.target.value })}
            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
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
