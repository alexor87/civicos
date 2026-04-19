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
import { Inbox, Users, Save, Loader2, FlaskConical, X } from 'lucide-react'
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
import { ContactPicker } from './ContactPicker'

interface Segment {
  id: string
  name: string
}

interface SelectedContact {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface Props {
  segments: Segment[]
  action: (formData: FormData) => Promise<unknown>
  initialData?: ExtractedBlocks & { recipientIds?: string[]; recipientContacts?: SelectedContact[] }
  submitLabel?: string
  isTemplate?: boolean
  campaignId?: string
  userEmail?: string
}

export function EmailBuilderEditor({ segments, action, initialData, submitLabel = 'Guardar borrador', isTemplate = false, campaignId = '', userEmail = '' }: Props) {
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
  // Recipient mode: 'segment' (all or segment-based) or 'manual' (hand-picked contacts)
  const [recipientMode, setRecipientMode] = useState<'segment' | 'manual'>(
    initialData?.recipientIds?.length ? 'manual' : 'segment'
  )
  const [manualIds, setManualIds] = useState<string[]>(initialData?.recipientIds ?? [])
  const [manualContacts, setManualContacts] = useState<SelectedContact[]>(initialData?.recipientContacts ?? [])
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [countLoading, setCountLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  // Test email state
  const [testOpen, setTestOpen] = useState(false)
  const [testEmail, setTestEmail] = useState(userEmail)
  const [testSending, setTestSending] = useState(false)
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
  const fetchCount = useCallback(async (segmentId: string, ids?: string[]) => {
    setCountLoading(true)
    try {
      let params = ''
      if (ids && ids.length > 0) {
        params = `?ids=${ids.join(',')}`
      } else if (segmentId) {
        params = `?segmentId=${segmentId}`
      }
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
    if (recipientMode === 'manual') {
      if (manualIds.length > 0) fetchCount('', manualIds)
      else setRecipientCount(0)
    } else {
      fetchCount(meta.segmentId)
    }
  }, [meta.segmentId, recipientMode, manualIds, fetchCount])

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
    if (recipientMode === 'manual' && manualIds.length > 0) {
      formData.set('recipient_ids', JSON.stringify(manualIds))
    }

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

  async function handleTestSend() {
    if (!testEmail || !meta.subject.trim()) {
      toast.error('Completa el asunto del email antes de enviar una prueba')
      return
    }
    if (blocks.length === 0) {
      toast.error('Añade al menos un bloque al correo')
      return
    }
    setTestSending(true)
    try {
      const html = generateFromBlocks(blocks, meta)
      const res = await fetch('/api/comunicaciones/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: meta.subject, body_html: html, to_email: testEmail }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(`Email de prueba enviado a ${testEmail}`)
        setTestOpen(false)
      } else {
        toast.error(data.error ?? 'Error al enviar email de prueba')
      }
    } catch {
      toast.error('Error al enviar email de prueba')
    } finally {
      setTestSending(false)
    }
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
                      value={recipientMode === 'manual' ? 'manual' : (meta.segmentId || 'all')}
                      onValueChange={v => {
                        if (v === 'manual') {
                          setRecipientMode('manual')
                          setMeta(m => ({ ...m, segmentId: '' }))
                        } else {
                          setRecipientMode('segment')
                          setMeta(m => ({ ...m, segmentId: (v === 'all' ? '' : v) as string }))
                        }
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los contactos</SelectItem>
                        {segments.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                        <SelectItem value="manual">Selección manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="segment_id" value={recipientMode === 'manual' ? '' : meta.segmentId} />

                    {recipientMode === 'manual' && (
                      <div className="mt-2">
                        <ContactPicker
                          campaignId={campaignId}
                          selectedIds={manualIds}
                          selectedContacts={manualContacts}
                          onChange={(ids, contacts) => { setManualIds(ids); setManualContacts(contacts) }}
                        />
                      </div>
                    )}

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

          {/* Save + Test buttons */}
          <div className="p-4 border-t space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {submitLabel}
            </Button>

            {!isTemplate && (
              testOpen ? (
                <div className="flex items-center gap-1.5 bg-muted border rounded-md px-2 py-1.5">
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleTestSend()
                      }
                    }}
                    className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleTestSend}
                    disabled={testSending || !testEmail}
                    className="h-6 text-xs px-2 shrink-0"
                  >
                    {testSending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Enviar'}
                  </Button>
                  <button type="button" onClick={() => setTestOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-muted-foreground"
                  size="sm"
                  onClick={() => setTestOpen(true)}
                >
                  <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                  Enviar prueba
                </Button>
              )
            )}
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
