import { Skeleton } from '@/components/ui/skeleton'

export default function ReportesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#dcdee6] rounded-md p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Two charts side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#dcdee6] rounded-md p-5 space-y-4">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-64 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Wide chart */}
        <div className="bg-white border border-[#dcdee6] rounded-md p-5 space-y-4">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-72 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
