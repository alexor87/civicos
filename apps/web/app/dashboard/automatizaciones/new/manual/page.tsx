import Link from 'next/link'
import { ArrowLeft, Sliders } from 'lucide-react'
import { VisualFlowEditor } from '@/components/dashboard/flows/VisualFlowEditor'

export const metadata = { title: 'Crear Flow manualmente · CivicOS' }

export default function NewFlowManualPage() {
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
        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Sliders className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Crear manualmente</h1>
          <p className="text-sm text-slate-500">Elige el disparador y las acciones paso a paso</p>
        </div>
      </div>

      <VisualFlowEditor />
    </div>
  )
}
