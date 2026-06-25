import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Content-shaped skeleton that mirrors the structure of the dashboard
 * (header, stat tiles, two cards). Renders instantly so perceived load is fast.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 lg:space-y-5 pb-20 lg:pb-6 animate-in fade-in">
      {/* Greeting row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-20 rounded-2xl" />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 rounded-2xl border-border/40">
            <Skeleton className="h-8 w-8 rounded-xl mb-3" />
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-3 w-12" />
          </Card>
        ))}
      </div>

      {/* Large card */}
      <Card className="p-4 rounded-2xl border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </Card>

      {/* Two-col cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-4 rounded-2xl border-border/40 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
