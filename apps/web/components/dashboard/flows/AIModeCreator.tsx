'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Zap, RotateCcw } from 'lucide-react'
import { GenerateFlowResponse, TriggerConfig, ActionConfig } from './flowTypes'
import { FlowRecipeCard } from './FlowRecipeCard'
import { FlowPreview } from './FlowPreview'

type State = 'idle' | 'generating' | 'result' | 'saving' | 'success'

const SUGGESTIONS = [
  'El día del cumpleaños de cada contacto, enviar un WhatsApp de saludo de parte del candidato',
  'Cuando alguien pase a ser simpatizante fuerte, agradecerle con un mensaje',
  'Si un contacto lleva más de 21 días sin ser contactado, notificarme',
  'Cuando un voluntario registre que alguien quiere donar, crear una tarea para llamarlo',
]

export function AIModeCreator() {
  const router = useRouter()

  const [state, setState]       = useState<State>('idle')
  const [input, setInput]       = useState('')
  const [error, setError]       = useState<string | null>(null)

  // Resultado de la IA
  const [generated, setGenerated]     = useState<GenerateFlowResponse | null>(null)
  const [flowName, setFlowName]       = useState('')
  const [editedMessage, setEditedMessage] = useState<string | null>(null)

  // Success
  const [createdFlowId, setCreatedFlowId] = useState<string | null>(null)

  async function handleGenerate() {
    if (!input.trim()) return
    setState('generating')
    setError(null)
    try {
      const res = await fetch('/api/flows/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ naturalLanguageInput: input }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error generando el Flow')

      setGenerated(data)
      setFlowName(data.flowConfig?.name ?? 'Mi automatización')
      setEditedMessage(null)
      setState('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado. Intenta de nuevo.')
      setState('idle')
    }
  }

  async function handleSave(activate: boolean) {
    if (!generated) return
    setState('saving')
    setError(null)
    try {
      // Aplicar mensaje editado si existe
      const actionsConfig = editedMessage
        ? (generated.flowConfig.actions_config as ActionConfig[]).map(a =>
            a.type === 'send_whatsapp'
              ? { ...a, config: { ...a.config, message: editedMessage } }
              : a
          )
        : generated.flowConfig.actions_config

      const res = await fetch('/api/flows', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:                   flowName,
          category:               generated.flowConfig.category,
          icon:                   generated.flowConfig.icon,
          trigger_config:         generated.flowConfig.trigger_config,
          filter_config:          generated.flowConfig.filter_config,
          actions_config:         actionsConfig,
          status:                 activate ? 'active' : 'draft',
          ai_generated:           true,
          natural_language_input: input,
        }),
      })
      const flow = await res.json()
      if (!res.ok) throw new Error(flow.error ?? 'Error creando el Flow')

      setCreatedFlowId(flow.id)
      setState('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando. Intenta de nuevo.')
      setState('result')
    }
  }

  // Estado: success ─────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
        <div className="h-20 w-20 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
          <Zap className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">¡Flow activado!</h2>
        <p className="text-sm text-slate-500 mb-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">&quot;{flowName}&quot;</span> está listo y funcionando.
        </p>
        <p className="text-xs text-slate-400 mb-8">
          Se ejecutará automáticamente cuando se cumpla la condición.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => createdFlowId && router.push(`/dashboard/automatizaciones/${createdFlowId}`)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Ver el Flow
          </button>
          <button
            onClick={() => { setState('idle'); setInput(''); setGenerated(null) }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Crear otro Flow
          </button>
        </div>
      </div>
    )
  }

  // Estado: idle ────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <p className="text-sm text-slate-500 mb-3 text-center">
            Cuéntame qué quieres automatizar. Puedes escribirlo como si me lo estuvieras explicando a mí.
          </p>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate() }}
            placeholder="Ejemplo: Quiero que el día del cumpleaños de cada contacto le llegue un WhatsApp de saludo de parte del candidato con su nombre..."
            rows={4}
            className="w-full text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400"
            data-testid="ai-input"
          />

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!input.trim()}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="generate-btn"
          >
            <Zap className="h-4 w-4" />
            Construir mi Flow →
          </button>
        </div>

        {/* Sugerencias */}
        <div>
          <p className="text-xs text-slate-400 mb-2 text-center">O prueba con uno de estos ejemplos:</p>
          <div className="space-y-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="w-full text-left text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Estado: generating ──────────────────────────────────────────
  if (state === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center" data-testid="generating-spinner">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Construyendo tu Flow…</p>
        <p className="text-xs text-slate-400 mt-1">La IA está analizando tu descripción</p>
      </div>
    )
  }

  // Estado: result / saving ─────────────────────────────────────
  if ((state === 'result' || state === 'saving') && generated) {
    const whatsappMsg = editedMessage
      ?? (generated.flowConfig.actions_config as ActionConfig[])
          .find(a => a.type === 'send_whatsapp') as
             | { type: 'send_whatsapp'; config: { message: string } }
             | undefined
           |  undefined

    const msgValue = editedMessage
      ?? (whatsappMsg && 'config' in whatsappMsg ? whatsappMsg.config.message : undefined)

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Botón de regenerar */}
        <button
          onClick={() => setState('idle')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Cambiar mi descripción
        </button>

        {/* Tarjeta de receta */}
        <FlowRecipeCard
          name={flowName}
          trigger_config={generated.flowConfig.trigger_config as TriggerConfig}
          filter_config={generated.flowConfig.filter_config}
          actions_config={generated.flowConfig.actions_config as ActionConfig[]}
          editable={true}
          onMessageChange={setEditedMessage}
        />

        {/* Vista previa */}
        {msgValue && (
          <FlowPreview
            message={msgValue}
            initialContact={generated.previewContact}
            renderedMessage={generated.renderedMessage}
          />
        )}

        {/* Nombre del Flow */}
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
            Nombre del Flow
          </label>
          <input
            value={flowName}
            onChange={e => setFlowName(e.target.value)}
            className="w-full text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="flow-name-input"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={state === 'saving'}
            className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            data-testid="save-draft-btn"
          >
            {state === 'saving' ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Guardar como borrador'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={state === 'saving'}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            data-testid="activate-btn"
          >
            {state === 'saving'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <><Zap className="h-4 w-4" /> Activar Flow</>
            }
          </button>
        </div>
      </div>
    )
  }

  return null
}
