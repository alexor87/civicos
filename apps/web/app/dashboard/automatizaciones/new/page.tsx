'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, BookOpen } from 'lucide-react'
import { TemplateLibrary } from '@/components/dashboard/flows/TemplateLibrary'

export default function NewFlowSelectorPage() {
  const router = useRouter()
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/automatizaciones"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a automatizaciones
      </Link>

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Crear nuevo Flow</h1>
        <p className="text-sm text-slate-500">¿Cómo quieres crear tu automatización?</p>
      </div>

      {!showTemplates ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Crear con IA */}
          <button
            onClick={() => router.push('/dashboard/automatizaciones/new/ia')}
            className="group relative bg-white dark:bg-slate-900 border-2 border-primary rounded-xl p-6 text-left hover:shadow-lg transition-all"
            data-testid="create-with-ai-btn"
          >
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Recomendado
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Crear con IA</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Descríbele a la IA lo que quieres que pase y ella construye el Flow por ti. Sin conocimientos técnicos.
            </p>
          </button>

          {/* Usar plantilla */}
          <button
            onClick={() => setShowTemplates(true)}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-left hover:shadow-md hover:border-slate-300 transition-all"
            data-testid="use-template-btn"
          >
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Usar una plantilla</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Elige una de nuestras plantillas listas para usar. Solo personaliza el mensaje y activa.
            </p>
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setShowTemplates(false)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Biblioteca de plantillas</h2>
          </div>
          <TemplateLibrary />
        </div>
      )}
    </div>
  )
}
