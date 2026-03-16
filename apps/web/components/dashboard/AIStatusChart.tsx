'use client'

interface Props {
  active: number
  applied: number
  dismissed: number
}

export function AIStatusChart({ active, applied, dismissed }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white border border-[#dcdee6] rounded-md px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#2960ec]" />
          <span className="text-xs text-[#6a737d]">Activas</span>
        </div>
        <span className="text-2xl font-bold text-[#1b1f23] tabular-nums">{active}</span>
        <span className="text-xs text-[#6a737d]">Pendientes de revisión</span>
      </div>

      <div className="bg-white border border-[#dcdee6] rounded-md px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#28a745]" />
          <span className="text-xs text-[#6a737d]">Aplicadas</span>
        </div>
        <span className="text-2xl font-bold text-[#1b1f23] tabular-nums">{applied}</span>
        <span className="text-xs text-[#6a737d]">Acciones ejecutadas</span>
      </div>

      <div className="bg-white border border-[#dcdee6] rounded-md px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#959da5]" />
          <span className="text-xs text-[#6a737d]">Descartadas</span>
        </div>
        <span className="text-2xl font-bold text-[#1b1f23] tabular-nums">{dismissed}</span>
        <span className="text-xs text-[#6a737d]">Ignoradas o rechazadas</span>
      </div>
    </div>
  )
}
