'use client'

import { useState, useCallback, useEffect, useTransition } from 'react'
import { isRedirectError } from 'next/dist/client/components/redirect'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Inbox, Users, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  type EmailBlock,
  type BlockType,
  type CampaignMeta,
  type ExtractedBlocks,
  generateFromBlocks,
  createDefaultBlock,
} from '@/lib/email-blocks'
import { BlockPalette } from './BlockPalette'
import { BuilderCanvas, CANVAS_DROP_ID } from './BuilderCanvas'
import { PropertiesPanel } from './PropertiesPanel'
import { AIGeneratePanel } from './AIGeneratePanel'

interface Segment {
  id: string
  name: string
}

interface Props {
  segments: Segment[]
  action: (formData: FormData) => Promise<unknown>
  initialData?: ExtractedBlocks
  submitLabel?: string
  isTemplate?: boolean
}

export function EmailBuilderEditor({ segments, action, initialData, submitLabel = 'Guardar borrador', isTemplate = false }: Props) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(
    initialData?.blocks ?? [createDefaultBlock('header'), createDefaultBlock('text')]
  )
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [meta, setMeta] = useState<CampaignMeta>({
    name: initialData?.meta.name ?? '',
    subject: initialData?.meta.subject ?? '',
    segmentId: initialData?.meta.segmentId ?? '',
    senderName: initialData?.meta.senderName ?? '',
    accentColor: initialData?.meta.accentColor ?? '#2960ec',
  })
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [countLoading, setCountLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  // ── dnd-kit sensors ─────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)

    // ── Palette → Canvas: insert new block ────────────────────────────────
    if (activeIdStr.startsWith('palette-')) {
      const type = activeIdStr.replace('palette-', '') as BlockType
      const newBlock = createDefaultBlock(type)

      if (overIdStr === CANVAS_DROP_ID) {
        // Dropped on the canvas drop zone — append at end
        setBlocks(prev => [...prev, newBlock])
      } else {
        // Dropped over an existing block — insert after it
        setBlocks(prev => {
          const overIndex = prev.findIndex(b => b.id === overIdStr)
          const insertAt = overIndex >= 0 ? overIndex + 1 : prev.length
          const updated = [...prev]
          updated.splice(insertAt, 0, newBlock)
          return updated
        })
      }
      setSelectedBlockId(newBlock.id)
      return
    }

    // ── Canvas → Canvas: reorder ──────────────────────────────────────────
    if (activeIdStr !== overIdStr && overIdStr !== CANVAS_DROP_ID) {
      setBlocks(prev => {
        const oldIndex = prev.findIndex(b => b.id === activeIdStr)
        const newIndex = prev.findIndex(b => b.id === overIdStr)
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(prev, oldIndex, newIndex)
        }
        return prev
      })
    }
  }

  // Active palette type for DragOverlay
  const activePaletteType = activeId?.startsWith('palette-')
    ? (activeId.replace('palette-', '') as BlockType)
    : null
  const activeCanvasBlock = activeId && !activeId.startsWith('palette-')
    ? blocks.find(b => b.id === activeId) ?? null
    : null

  // ── Recipient count ──────────────────────────────────────────────────────────
  const fetchCount = useCallback(async (segmentId: string) => {
    setCountLoading(true)
    try {
      const params = segmentId ? `?segmentId=${segmentId}` : ''
      const res = await fetch(`/api/contacts/count${params}`)
      const data = await res.json()
      setRecipientCount(data.count ?? null)
    } catch {
      setRecipientCount(null)
    } finally {
      setCountLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCount(meta.segmentId)
  }, [meta.segmentId, fetchCount])

  const selectedBlock = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) ?? null : null

  function handleBlockChange(updated: EmailBlock) {
    setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  function handleDelete(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!meta.name.trim()) { toast.error('El nombre de la campaña es obligatorio'); return }
    if (!meta.subject.trim()) { toast.error('El asunto del email es obligatorio'); return }
    if (blocks.length === 0) { toast.error('Añade al menos un bloque al correo'); return }

    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    formData.set('body_html', generateFromBlocks(blocks, meta))

    startTransition(async () => {
      try {
        await action(formData)
      } catch (err) {
        if (isRedirectError(err)) throw err
        toast.error('Error al guardar la campaña')
      } finally {
        setIsSaving(false)
      }
    })
  }

  const isLoading = isSaving || isPending

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <form onSubmit={handleSubmit} className="flex h-screen overflow-hidden bg-background">

        {/* ── Left panel: Palette + Settings ──────────────────────────────── */}
        <div className="w-60 flex-shrink-0 border-r flex flex-col bg-background overflow-y-auto">
          {/* Back nav */}
          <div className="px-4 pt-4 pb-3 border-b">
            <Link href="/dashboard/comunicaciones" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              ← Volver a Comunicaciones
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Block palette */}
            <BlockPalette />

            {/* Settings */}
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Configuración
              </p>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Nombre de la campaña *</Label>
                  <Input
                    name="name"
                    value={meta.name}
                    onChange={e => setMeta(m => ({ ...m, name: e.target.value }))}
                    placeholder="Ej: Newsletter Marzo"
                    required
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Asunto del email *</Label>
                  <Input
                    name="subject"
                    value={meta.subject}
                    onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))}
                    placeholder="Ej: Únete a nuestra causa"
                    required
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Remitente</Label>
                  <Input
                    name="sender_name"
                    value={meta.senderName}
                    onChange={e => setMeta(m => ({ ...m, senderName: e.target.value }))}
                    placeholder="El equipo de campaña"
                    className="text-sm"
                  />
                </div>

                {!isTemplate && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Destinatarios</Label>
                    <Select
                      value={meta.segmentId || 'all'}
                      onValueChange={v => setMeta(m => ({ ...m, segmentId: (v === 'all' ? '' : v) as string }))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los contactos</SelectItem>
                        {segments.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="segment_id" value={meta.segmentId} />

                    <div className="flex items-center gap-1.5 mt-1.5">
                      {countLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      ) : (
                        <Users className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {countLoading ? 'Calculando...' : recipientCount !== null ? `${recipientCount} destinatarios` : '—'}
                      </span>
                    </div>
                  </div>
                )}
                <input type="hidden" name="is_template" value={String(isTemplate)} />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="p-4 border-t">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {submitLabel}
            </Button>
          </div>
        </div>

        {/* ── Center: Canvas ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Inbox preview bar */}
          <div className="border-b bg-background px-6 py-2 flex-shrink-0">
            <div className="max-w-[600px] mx-auto">
              <InboxBar subject={meta.subject} />
            </div>
          </div>

          {/* AI inline panel */}
          <AIGeneratePanel
            onApply={(subject, newBlocks) => {
              setMeta(m => ({ ...m, subject }))
              setBlocks(newBlocks)
              setSelectedBlockId(null)
            }}
          />

          <BuilderCanvas
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelect={setSelectedBlockId}
            onDelete={handleDelete}
            onUpdate={handleBlockChange}
          />
        </div>

        {/* ── Right panel: Properties ──────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-l flex flex-col bg-background overflow-hidden">
          <PropertiesPanel
            block={selectedBlock}
            onChange={handleBlockChange}
            onDelete={handleDelete}
          />
        </div>

      </form>

      {/* Drag overlay — ghost preview while dragging */}
      <DragOverlay dropAnimation={null}>
        {activePaletteType && (
          <PaletteDragGhost type={activePaletteType} />
        )}
        {activeCanvasBlock && (
          <div className="opacity-70 shadow-2xl rounded border-2 border-primary max-w-[600px] pointer-events-none">
            <div className="bg-background text-sm px-4 py-3 font-medium">{activeCanvasBlock.type}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ── Drag ghost for palette items ───────────────────────────────────────────────

const BLOCK_LABELS: Record<string, string> = {
  header: 'Encabezado', text: 'Texto', image: 'Imagen',
  button: 'Botón', divider: 'Divisor', spacer: 'Espaciador',
}

function PaletteDragGhost({ type }: { type: BlockType }) {
  return (
    <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 shadow-xl text-sm font-semibold pointer-events-none whitespace-nowrap">
      + {BLOCK_LABELS[type]}
    </div>
  )
}

// ── Inbox simulation bar ───────────────────────────────────────────────────────

function InboxBar({ subject }: { subject: string }) {
  return (
    <div className="bg-muted/30 border border-border rounded-md px-4 py-2 flex items-center gap-3">
      <div className="h-7 w-7 rounded-full bg-[#2960ec] flex items-center justify-center shrink-0">
        <span className="text-white text-xs font-bold">C</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">Scrutix Campaña</span>
          <span className="text-xs text-muted-foreground">· ahora</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{subject || 'Asunto del email…'}</p>
      </div>
      <Inbox className="h-4 w-4 text-muted-foreground/40 shrink-0" />
    </div>
  )
}
