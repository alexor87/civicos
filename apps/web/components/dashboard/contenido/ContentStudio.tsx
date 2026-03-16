'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Copy, CheckCheck, Mail, MessageSquare, Smartphone, Mic, Megaphone, Share2, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { generateContent, type ContentType, type ContentTone, type GenerateContentResult } from '@/app/dashboard/contenido/generate-action'

// ── Types ─────────────────────────────────────────────────────────────────────

const PLACEHOLDERS: Record<ContentType, string> = {
  email:          'Describe el email que quieres generar (ej: invitación al mitin del 20 de marzo, anuncio de nueva propuesta de salud...)',
  script:         'Describe el contexto del canvassing (ej: script para zona norte, conversación sobre propuestas de transporte...)',
  sms:            'Describe el mensaje SMS (ej: recordatorio para el día de elecciones, invitación a evento, alerta urgente...)',
  talking_points: 'Describe el tema o evento (ej: propuestas de empleo y educación, debate sobre seguridad, entrevista de TV...)',
  speech:         'Describe el discurso (ej: discurso de cierre de campaña, mitin en zona norte, lanzamiento de propuesta educativa...)',
  social_post:    'Describe el contenido del post (ej: anuncio de propuesta de salud, celebración de logro, convocatoria a evento...)',
  press_release:  'Describe el comunicado (ej: anuncio de candidatura, presentación de propuesta económica, respuesta a oponente...)',
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-[#2960ec] hover:text-[#0a41cc] font-medium"
    >
      {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

// ── Result views ──────────────────────────────────────────────────────────────

function EmailResult({ result }: { result: GenerateContentResult }) {
  return (
    <div className="space-y-4">
      {result.subject && (
        <div className="bg-[#f6f7f8] rounded-md p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-wide">Asunto del email</p>
            <CopyButton text={result.subject} />
          </div>
          <p className="text-sm font-medium text-[#1b1f23]">{result.subject}</p>
        </div>
      )}
      {result.blocks && result.blocks.length > 0 && (
        <div className="bg-[#f6f7f8] rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-wide">Bloques generados ({result.blocks.length})</p>
            <CopyButton text={result.blocks.map(b => {
              const p = b.props as Record<string, string>
              return p.content ?? p.text ?? ''
            }).filter(Boolean).join('\n\n')} />
          </div>
          <div className="space-y-2">
            {result.blocks.map((block, i) => {
              const p = block.props as Record<string, string>
              return (
              <div key={i} className="bg-white border border-[#dcdee6] rounded px-3 py-2">
                <span className="text-[10px] font-medium text-[#2960ec] uppercase">{block.type}</span>
                {block.type === 'header' && (
                  <p className="text-sm font-semibold text-[#1b1f23] mt-0.5">
                    {p.text}
                    {p.subtext && (
                      <span className="text-xs font-normal text-[#6a737d] ml-2">— {p.subtext}</span>
                    )}
                  </p>
                )}
                {block.type === 'text' && (
                  <p className="text-xs text-[#6a737d] mt-0.5 line-clamp-3">{p.content}</p>
                )}
                {block.type === 'button' && (
                  <p className="text-xs font-medium text-[#2960ec] mt-0.5">[{p.text}]</p>
                )}
              </div>
              )
            })}
          </div>
          <p className="text-[10px] text-[#6a737d] mt-2">
            Estos bloques se pueden aplicar directamente desde el editor de emails.
          </p>
        </div>
      )}
    </div>
  )
}

function ScriptResult({ result }: { result: GenerateContentResult }) {
  if (!result.script) return null
  const fullText = `Intro:\n${result.script.intro}\n\nPreguntas:\n${result.script.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nCierre:\n${result.script.closing}`
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-wide">Script generado</p>
        <CopyButton text={fullText} />
      </div>
      <div className="bg-[#f6f7f8] rounded-md p-3 space-y-3">
        <div>
          <p className="text-[10px] font-semibold text-[#2960ec] uppercase mb-1">Presentación</p>
          <p className="text-sm text-[#1b1f23]">{result.script.intro}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-[#2960ec] uppercase mb-1">Preguntas</p>
          <ol className="space-y-1.5">
            {result.script.questions.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#1b1f23]">
                <span className="text-[#6a737d] shrink-0">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-[#2960ec] uppercase mb-1">Cierre</p>
          <p className="text-sm text-[#1b1f23]">{result.script.closing}</p>
        </div>
      </div>
    </div>
  )
}

function SmsResult({ result }: { result: GenerateContentResult }) {
  if (!result.sms_text) return null
  const charCount = result.sms_text.length
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-wide">Mensaje SMS</p>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${charCount > 160 ? 'text-red-500' : 'text-[#6a737d]'}`}>
            {charCount}/160 chars
          </span>
          <CopyButton text={result.sms_text} />
        </div>
      </div>
      <div className="bg-[#f6f7f8] rounded-md p-4">
        <p className="text-sm text-[#1b1f23] leading-relaxed">{result.sms_text}</p>
      </div>
      {charCount > 160 && (
        <p className="text-xs text-red-500">El mensaje supera los 160 caracteres. Será enviado como 2 SMS.</p>
      )}
    </div>
  )
}

function TalkingPointsResult({ result }: { result: GenerateContentResult }) {
  if (!result.points?.length) return null
  const fullText = result.points.map((p, i) => `${i + 1}. ${p}`).join('\n')
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-wide">{result.points.length} talking points</p>
        <CopyButton text={fullText} />
      </div>
      <ol className="space-y-2">
        {result.points.map((point, i) => (
          <li key={i} className="flex gap-3 bg-[#f6f7f8] rounded-md px-3 py-2.5">
            <span className="text-sm font-semibold text-[#2960ec] shrink-0 w-5">{i + 1}</span>
            <p className="text-sm text-[#1b1f23]">{point}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function SpeechResult({ result }: { result: GenerateContentResult }) {
  if (!result.speech) return null
  const fullText = `${result.speech.opening}\n\n${result.speech.body.join('\n\n')}\n\n${result.speech.closing}`
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Discurso generado · {result.speech.duration}</p>
        <CopyButton text={fullText} />
      </div>
      <div className="space-y-3">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-primary uppercase mb-1">Apertura</p>
          <p className="text-sm text-slate-800 leading-relaxed">{result.speech.opening}</p>
        </div>
        {result.speech.body.map((block, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-primary uppercase mb-1">Bloque {i + 1}</p>
            <p className="text-sm text-slate-800 leading-relaxed">{block}</p>
          </div>
        ))}
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-primary uppercase mb-1">Cierre</p>
          <p className="text-sm text-slate-800 leading-relaxed">{result.speech.closing}</p>
        </div>
      </div>
    </div>
  )
}

function SocialPostResult({ result }: { result: GenerateContentResult }) {
  if (!result.social_posts) return null
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Posts para redes sociales</p>
      {[
        { key: 'twitter' as const, label: 'X / Twitter', color: 'text-sky-500' },
        { key: 'instagram' as const, label: 'Instagram', color: 'text-pink-500' },
        { key: 'facebook' as const, label: 'Facebook', color: 'text-blue-600' },
      ].map(({ key, label, color }) => (
        <div key={key} className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className={`text-[10px] font-semibold uppercase ${color}`}>{label}</p>
            <CopyButton text={result.social_posts![key]} />
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">{result.social_posts![key]}</p>
          <p className="text-[10px] text-slate-400 mt-1">{result.social_posts![key].length} chars</p>
        </div>
      ))}
    </div>
  )
}

function PressReleaseResult({ result }: { result: GenerateContentResult }) {
  if (!result.press_release) return null
  const pr = result.press_release
  const fullText = `${pr.headline}\n${pr.subheadline}\n\n${pr.body}\n\n"${pr.quote}"\n\n${pr.boilerplate}`
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Comunicado de prensa</p>
        <CopyButton text={fullText} />
      </div>
      <div className="space-y-2">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-primary uppercase mb-1">Titular</p>
          <p className="text-base font-bold text-slate-900">{pr.headline}</p>
          <p className="text-sm text-slate-600 mt-0.5">{pr.subheadline}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-primary uppercase mb-1">Cuerpo</p>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{pr.body}</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-primary uppercase mb-1">Cita oficial</p>
          <p className="text-sm text-slate-800 italic">"{pr.quote}"</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Boilerplate</p>
          <p className="text-xs text-slate-600">{pr.boilerplate}</p>
        </div>
      </div>
    </div>
  )
}

// ── Prompt form ───────────────────────────────────────────────────────────────

function GenerateForm({
  type,
  onResult,
}: {
  type: ContentType
  onResult: (r: GenerateContentResult) => void
}) {
  const [prompt, setPrompt]   = useState('')
  const [tone, setTone]       = useState<ContentTone>('cercano')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<GenerateContentResult | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error('Escribe una descripción'); return }
    setLoading(true)
    setResult(null)
    const res = await generateContent(type, prompt, tone)
    setLoading(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      setResult(res)
      onResult(res)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={PLACEHOLDERS[type]}
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={tone} onValueChange={v => setTone(v as ContentTone)}>
          <SelectTrigger className="w-52 text-sm">
            <SelectValue placeholder="Seleccionar tono" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cercano">Cercano y motivacional</SelectItem>
            <SelectItem value="formal">Formal y profesional</SelectItem>
            <SelectItem value="urgente">Urgente — llamado a la acción</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="gap-1.5 flex-1"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generando…</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generar con IA</>
          )}
        </Button>
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="pt-2 border-t border-slate-200">
          {type === 'email'          && <EmailResult result={result} />}
          {type === 'script'         && <ScriptResult result={result} />}
          {type === 'sms'            && <SmsResult result={result} />}
          {type === 'talking_points' && <TalkingPointsResult result={result} />}
          {type === 'speech'         && <SpeechResult result={result} />}
          {type === 'social_post'    && <SocialPostResult result={result} />}
          {type === 'press_release'  && <PressReleaseResult result={result} />}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

const ALL_CONTENT_TYPES: { type: ContentType; label: string; icon: React.ElementType }[] = [
  { type: 'email',          label: 'Email',         icon: Mail          },
  { type: 'script',         label: 'Script',        icon: MessageSquare },
  { type: 'sms',            label: 'SMS',           icon: Smartphone    },
  { type: 'talking_points', label: 'Talking Points',icon: Mic           },
  { type: 'speech',         label: 'Discurso',      icon: Megaphone     },
  { type: 'social_post',    label: 'Redes',         icon: Share2        },
  { type: 'press_release',  label: 'Prensa',        icon: Newspaper     },
]

export function ContentStudio() {
  const [activeType, setActiveType] = useState<ContentType>('email')
  const [, setLastResult] = useState<GenerateContentResult | null>(null)

  return (
    <Tabs value={activeType} onValueChange={v => setActiveType(v as ContentType)}>
      <TabsList className="grid w-full grid-cols-4 mb-2">
        {ALL_CONTENT_TYPES.slice(0, 4).map(({ type, label, icon: Icon }) => (
          <TabsTrigger key={type} value={type} className="gap-1.5 text-xs">
            <Icon className="h-3.5 w-3.5" /> {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsList className="grid w-full grid-cols-3 mb-6">
        {ALL_CONTENT_TYPES.slice(4).map(({ type, label, icon: Icon }) => (
          <TabsTrigger key={type} value={type} className="gap-1.5 text-xs">
            <Icon className="h-3.5 w-3.5" /> {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {ALL_CONTENT_TYPES.map(({ type }) => (
        <TabsContent key={type} value={type}>
          <GenerateForm type={type} onResult={setLastResult} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
