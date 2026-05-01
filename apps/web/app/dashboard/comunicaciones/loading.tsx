import { Skeleton } from '@/components/ui/skeleton'

export default function ComunicacionesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Email sub-tabs */}
        <div className="flex gap-1 border-b border-[#dcdee6] pb-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-32" />
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-[#dcdee6] rounded-md overflow-hidden divide-x divide-[#dcdee6]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Smart Comms collapsed panel */}
        <div className="bg-white border border-[#dcdee6] rounded-md px-5 py-4 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>

        {/* Campaign list */}
        <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-[#dcdee6] flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="divide-y divide-[#dcdee6]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
