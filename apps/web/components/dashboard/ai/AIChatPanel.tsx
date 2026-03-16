'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Suggestion {
  priority: string
  title: string
}

interface Props {
  campaignId: string
  campaignName: string
  recentSuggestions: Suggestion[]
}

const STARTER_QUESTIONS = [
  '¿Cuál es el estado actual de la campaña?',
  '¿En qué territorios debo enfocarme esta semana?',
  '¿Cómo mejorar la tasa de simpatizantes?',
]

export function AIChatPanel({ campaignId, campaignName, recentSuggestions }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim()
    if (!userText || isStreaming) return

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userText }
    const assistantId = crypto.randomUUID()
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '' }

    const nextMessages = [...messages, userMsg]
    setMessages([...nextMessages, assistantMsg])
    setInput('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `Error ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: accumulated } : m
        ))
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Error al obtener respuesta. Intenta de nuevo.' }
          : m
      ))
      toast.error(err instanceof Error ? err.message : 'Error al enviar mensaje')
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[520px]">
      {/* Context chips */}
      {recentSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1 pb-3 border-b mb-3">
          <span className="text-xs text-muted-foreground self-center">Contexto activo:</span>
          {recentSuggestions.slice(0, 3).map((s, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {s.title}
            </Badge>
          ))}
        </div>
      )}

      {/* Message list */}
      <ScrollArea className="flex-1 pr-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-4">
            <Bot className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">Asistente de {campaignName}</p>
              <p className="text-xs text-muted-foreground mt-1">Pregúntame sobre la estrategia, datos o próximos pasos</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {STARTER_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs text-left px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div className={cn(
                  'flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center',
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div className={cn(
                  'max-w-[80%] rounded-xl px-4 py-2.5 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted rounded-tl-sm'
                )}>
                  {msg.content || (
                    <span className="inline-flex gap-1 text-muted-foreground text-xs">
                      <span className="animate-bounce delay-0">·</span>
                      <span className="animate-bounce delay-75">·</span>
                      <span className="animate-bounce delay-150">·</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t mt-3">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta..."
          className="min-h-[40px] max-h-[120px] resize-none text-sm"
          rows={1}
          disabled={isStreaming}
        />
        <Button
          size="icon"
          onClick={() => sendMessage()}
          disabled={!input.trim() || isStreaming}
          aria-label="Enviar mensaje"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
