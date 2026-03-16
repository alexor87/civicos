'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  campaignId: string
}

const STARTER_QUESTIONS = [
  '¿Cuáles son las propuestas del candidato?',
  '¿Qué decir si me preguntan sobre seguridad?',
  '¿Cuál es la posición del candidato en salud?',
  '¿Cómo responder preguntas sobre economía?',
]

export function VolunteerChatbot({ campaignId }: Props) {
  const [messages, setMessages]     = useState<ChatMessage[]>([])
  const [input, setInput]           = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const textareaRef                 = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim()
    if (!userText || isStreaming) return

    const userMsg: ChatMessage      = { id: crypto.randomUUID(), role: 'user', content: userText }
    const assistantId               = crypto.randomUUID()
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '' }

    const nextMessages = [...messages, userMsg]
    setMessages([...nextMessages, assistantMsg])
    setInput('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/knowledge/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages:    nextMessages.map(m => ({ role: m.role, content: m.content })),
          campaign_id: campaignId,
        }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Error al obtener respuesta. Intenta de nuevo.' }
            : m
        ))
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        const snapshot = fullText
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: snapshot } : m
        ))
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Error de conexión. Intenta de nuevo.' }
          : m
      ))
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
    <div className="bg-white border border-[#dcdee6] rounded-md flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#dcdee6]">
        <div className="h-7 w-7 rounded-md bg-[#2960ec]/10 flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-[#2960ec]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1b1f23]">Chatbot de voluntarios</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Responde con base en documentos
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-[#6a737d] text-center">
              Pregunta sobre las propuestas y posiciones del candidato
            </p>
            <div className="grid grid-cols-1 gap-2">
              {STARTER_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs px-3 py-2 rounded-md border border-[#dcdee6] hover:border-[#2960ec] hover:bg-[#2960ec]/5 text-[#6a737d] hover:text-[#2960ec] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-[#2960ec] text-white'
                    : 'bg-[#f6f7f8] border border-[#dcdee6]'
                }`}>
                  {msg.role === 'user'
                    ? <User className="h-3.5 w-3.5" />
                    : <Bot className="h-3.5 w-3.5 text-[#6a737d]" />
                  }
                </div>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#2960ec] text-white rounded-tr-sm'
                    : 'bg-[#f6f7f8] text-[#1b1f23] rounded-tl-sm'
                }`}>
                  {msg.content || (
                    <span className="inline-flex gap-1">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse delay-100">●</span>
                      <span className="animate-pulse delay-200">●</span>
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
      <div className="p-3 border-t border-[#dcdee6] flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta sobre las propuestas del candidato…"
          rows={1}
          className="resize-none text-sm min-h-[36px] max-h-[100px]"
          disabled={isStreaming}
        />
        <Button
          size="sm"
          onClick={() => sendMessage()}
          disabled={!input.trim() || isStreaming}
          className="shrink-0 h-9 w-9 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
