'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, GripVertical } from 'lucide-react'

type QuestionType = 'single_select' | 'multi_select' | 'yes_no' | 'scale' | 'text_free'

interface Question {
  id: string
  text: string
  type: QuestionType
  required: boolean
  options?: { value: string; label: string }[]
  max_length?: number
}

const TYPE_LABELS: Record<QuestionType, string> = {
  single_select: 'Selección única',
  multi_select: 'Selección múltiple',
  yes_no: 'Sí / No',
  scale: 'Escala 1–5',
  text_free: 'Texto libre',
}

const NEEDS_OPTIONS: QuestionType[] = ['single_select', 'multi_select']

function newQuestion(): Question {
  return {
    id: `q${Date.now()}`,
    text: '',
    type: 'single_select',
    required: false,
    options: [{ value: '', label: '' }],
  }
}

export function ScriptEditor() {
  const [questions, setQuestions] = useState<Question[]>([])

  const addQuestion = useCallback(() => {
    setQuestions(prev => [...prev, newQuestion()])
  }, [])

  const removeQuestion = useCallback((index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateQuestion = useCallback((index: number, updates: Partial<Question>) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== index) return q
      const updated = { ...q, ...updates }
      // When switching to a type that needs options, ensure options exist
      if (updates.type && NEEDS_OPTIONS.includes(updates.type) && !updated.options?.length) {
        updated.options = [{ value: '', label: '' }]
      }
      return updated
    }))
  }, [])

  const addOption = useCallback((qIndex: number) => {
    setQuestions(prev => prev.map((q, i) =>
      i !== qIndex ? q : { ...q, options: [...(q.options ?? []), { value: '', label: '' }] }
    ))
  }, [])

  const updateOption = useCallback((qIndex: number, oIndex: number, field: 'value' | 'label', val: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const options = (q.options ?? []).map((o, oi) =>
        oi === oIndex ? { ...o, [field]: val } : o
      )
      return { ...q, options }
    }))
  }, [])

  const removeOption = useCallback((qIndex: number, oIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      return { ...q, options: (q.options ?? []).filter((_, oi) => oi !== oIndex) }
    }))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Preguntas del script</Label>
        <span className="text-xs text-slate-400">{questions.length} pregunta{questions.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Hidden field that submits the JSON */}
      <input type="hidden" name="questions" value={JSON.stringify(questions)} />

      {questions.length === 0 && (
        <div className="border border-dashed rounded-lg py-8 text-center text-slate-400 text-sm">
          Sin preguntas aún. Agrega la primera pregunta.
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="border rounded-lg p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-start gap-2">
              <GripVertical className="h-4 w-4 text-slate-300 mt-2.5 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 shrink-0">P{qIndex + 1}</span>
                  <Input
                    value={q.text}
                    onChange={e => updateQuestion(qIndex, { text: e.target.value })}
                    placeholder="Texto de la pregunta…"
                    className="flex-1"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={q.type}
                    onChange={e => updateQuestion(qIndex, { type: e.target.value as QuestionType })}
                    className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {Object.entries(TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={e => updateQuestion(qIndex, { required: e.target.checked })}
                      className="h-3.5 w-3.5 rounded accent-indigo-600"
                    />
                    Obligatoria
                  </label>

                  {q.type === 'text_free' && (
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      Máx chars:
                      <Input
                        type="number"
                        value={q.max_length ?? 300}
                        onChange={e => updateQuestion(qIndex, { max_length: parseInt(e.target.value) || 300 })}
                        className="w-16 h-6 text-xs px-1"
                        min={10}
                        max={2000}
                      />
                    </label>
                  )}
                </div>

                {/* Options editor for select types */}
                {NEEDS_OPTIONS.includes(q.type) && (
                  <div className="space-y-1.5 pl-2 border-l-2 border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">Opciones</p>
                    {(q.options ?? []).map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-1.5">
                        <Input
                          placeholder="valor_interno"
                          value={opt.value}
                          onChange={e => updateOption(qIndex, oIndex, 'value', e.target.value)}
                          className="w-32 h-7 text-xs"
                        />
                        <Input
                          placeholder="Etiqueta visible"
                          value={opt.label}
                          onChange={e => updateOption(qIndex, oIndex, 'label', e.target.value)}
                          className="flex-1 h-7 text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                          onClick={() => removeOption(qIndex, oIndex)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-indigo-600 hover:text-indigo-800 px-2"
                      onClick={() => addOption(qIndex)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar opción
                    </Button>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 shrink-0 mt-1"
                onClick={() => removeQuestion(qIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="w-full gap-1.5">
        <Plus className="h-4 w-4" />
        Agregar pregunta
      </Button>
    </div>
  )
}
