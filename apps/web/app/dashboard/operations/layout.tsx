import { OperationsTabs } from '@/components/operations/OperationsTabs'

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tareas</h1>
        <p className="text-sm text-slate-500 mt-1">Gestiona las tareas de tu equipo</p>
        <OperationsTabs />
      </div>
      <div className="flex-1 overflow-auto px-6 py-4">
        {children}
      </div>
    </div>
  )
}
