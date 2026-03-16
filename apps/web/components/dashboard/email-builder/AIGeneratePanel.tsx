'use client'

import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { generateContent, type ContentTone } from '@/app/dashboard/contenido/generate-action'
import { type EmailBlock } from '@/lib/email-blocks'

type PanelState = 'collapsed' | 'expanded' | 'loading' | 'done'

interface Props {
  onApply: (subject: string, blocks: EmailBlock[]) => void
}

export function AIGeneratePanel({ onApply }: Props) {
  const [state, setState] = useState<PanelState>('collapsed')
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState<ContentTone>('cercano')

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error('Describe el email que quieres generar'); return }
    setState('loading')
    const result = await generateContent('email', prompt, tone)

    if (result.error) {
      toast.error(result.error)
      setState('expanded')
      return
    }

    if (result.subject && result.blocks) {
      onApply(result.subject, result.blocks)
      setState('done')
    }
  }

  return (
    <div className="flex-shrink-0 border-b border-border bg-muted/20">
      <div className="max-w-[600px] mx-auto px-4 py-2">

        {/* ── Collapsed ──────────────────────────────────────────────────── */}
        {state === 'collapsed' && (
          <button
            type="button"
            onClick={() => setState('expanded')}
            className="w-full flex items-center justify-between py-1 group"
          >
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#2960ec]/80 group-hover:text-[#2960ec] transition-colors">
              <Sparkles className="h-3 w-3" />
              Generar este email con IA
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-[#2960ec]/60 transition-colors" />
          </button>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {state === 'loading' && (
          <div className="flex items-center gap-2 py-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2960ec]" />
            <span className="text-xs text-muted-foreground">Analizando campaña y generando contenido…</span>
          </div>
        )}

        {/* ── Done ───────────────────────────────────────────────────────── */}
        {state === 'done' && (
          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Email generado — edita los bloques abajo
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setState('expanded')}
              className="h-6 px-2 gap-1 text-xs text-muted-foreground hover:text-[#2960ec]"
              aria-label="Regenerar"
            >
              <RotateCcw className="h-3 w-3" />
              Regenerar
            </Button>
          </div>
        )}

        {/* ── Expanded ───────────────────────────────────────────────────── */}
        {state === 'expanded' && (
          <div className="py-2 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2960ec]">
                <Sparkles className="h-3 w-3" />
                Asistente IA
              </span>
              <button
                type="button"
                onClick={() => setState('collapsed')}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                aria-label="Cerrar"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Input row */}
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe el email que necesitas (ej: invitación al mitin del 20 de marzo en Plaza Mayor…)"
              rows={2}
              className="text-xs resize-none bg-background border-border/60 focus:border-[#2960ec]/40 placeholder:text-muted-foreground/50 leading-relaxed"
            />

            {/* Controls row */}
            <div className="flex items-center gap-2">
              <Select value={tone} onValueChange={v => setTone(v as ContentTone)}>
                <SelectTrigger className="h-7 text-xs w-44 bg-background border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cercano" className="text-xs">Cercano y motivacional</SelectItem>
                  <SelectItem value="formal" className="text-xs">Formal y profesional</SelectItem>
                  <SelectItem value="urgente" className="text-xs">Urgente — llamado a la acción</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                size="sm"
                className="h-7 px-3 gap-1.5 text-xs bg-[#2960ec] hover:bg-[#1a4bc4] ml-auto"
                aria-label="Generar email"
              >
                <Sparkles className="h-3 w-3" />
                Generar email
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
