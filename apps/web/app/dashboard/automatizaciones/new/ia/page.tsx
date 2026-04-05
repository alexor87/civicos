import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { AIModeCreator } from '@/components/dashboard/flows/AIModeCreator'

export const metadata = { title: 'Crear Flow con IA · Scrutix' }

export default function NewFlowIAPage() {
  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/automatizaciones/new"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Crear con IA</h1>
          <p className="text-sm text-slate-500">Descríbeme qué quieres automatizar y lo construyo por ti</p>
        </div>
      </div>

      <AIModeCreator />
    </div>
  )
}
