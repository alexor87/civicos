import { Sparkles } from 'lucide-react'
import { ContentStudio } from '@/components/dashboard/contenido/ContentStudio'

export default function ContenidoPage() {
  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-[#2960ec]" />
            <h1 className="text-2xl font-semibold text-[#1b1f23]">Generador de Contenido IA</h1>
          </div>
          <p className="text-sm text-[#6a737d]">
            Genera emails, scripts de canvassing, mensajes SMS y talking points
            en segundos, contextualizados con el perfil de tu campaña.
          </p>
        </div>

        {/* Studio */}
        <div className="bg-white border border-[#dcdee6] rounded-md p-6">
          <ContentStudio />
        </div>

      </div>
    </div>
  )
}
