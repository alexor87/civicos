import { Skeleton } from '@/components/ui/skeleton'

/**
 * Generic dashboard loading skeleton — fallback for any dashboard page that
 * doesn't define its own loading.tsx. Mirrors the typical structure: header,
 * KPI strip, main content card.
 */
export default function DashboardLoading() {
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-[#dcdee6] rounded-md overflow-hidden divide-x divide-[#dcdee6]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Main content card */}
      <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
        <div className="px-5 py-4 border-b border-[#dcdee6] flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="divide-y divide-[#dcdee6]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-20 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
