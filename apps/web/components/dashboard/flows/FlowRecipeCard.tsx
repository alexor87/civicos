'use client'

import { Calendar, Users, CheckCircle2, MessageSquare, Zap } from 'lucide-react'
import { TriggerConfig, ActionConfig, ACTION_CONFIG, describeTrigger, describeAction } from './flowTypes'

interface Props {
  name:           string
  trigger_config: TriggerConfig
  filter_config:  unknown[]
  actions_config: ActionConfig[]
  // Modo edición — permite editar el mensaje de WhatsApp
  editable?:      boolean
  onMessageChange?: (msg: string) => void
}

export function FlowRecipeCard({
  name,
  trigger_config,
  filter_config,
  actions_config,
  editable = false,
  onMessageChange,
}: Props) {
  const whatsappAction = actions_config.find(a => a.type === 'send_whatsapp') as
    | { type: 'send_whatsapp'; config: { message: string } }
    | undefined

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
      data-testid="flow-recipe-card"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-primary/5">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{name}</h3>
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* Cuándo ocurre */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cuándo ocurre</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {describeTrigger(trigger_config)}
          </p>
        </div>

        {/* Quién aplica */}
        {filter_config.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quién aplica</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Contactos con filtros específicos aplicados.
            </p>
          </div>
        )}

        {/* Qué pasa */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qué pasa</span>
          </div>
          <ol className="space-y-1">
            {actions_config.map((action, i) => {
              const cfg = ACTION_CONFIG[action.type as keyof typeof ACTION_CONFIG]
              return (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 font-mono text-xs mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                  <span>
                    <span className="mr-1">{cfg?.icon}</span>
                    {describeAction(action)}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Mensaje de WhatsApp */}
        {whatsappAction && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mensaje que recibirán</span>
            </div>
            {editable ? (
              <textarea
                value={whatsappAction.config.message}
                onChange={e => onMessageChange?.(e.target.value)}
                rows={4}
                className="w-full text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                data-testid="message-editor"
              />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {whatsappAction.config.message}
                </p>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5">
              Las variables entre &#123;llaves&#125; se reemplazan automáticamente con los datos de cada contacto.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
