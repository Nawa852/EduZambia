import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/** Skeleton matching HubPageLayout: hero + tab bar + content grid. */
export function HubSkeleton({ tiles = 6 }: { tiles?: number }) {
  return (
    <div className="space-y-4 max-w-[1280px] mx-auto animate-in fade-in">
      <Card className="p-4 lg:p-5 rounded-2xl border-border/40">
        <div className="flex items-center gap-3.5">
          <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40 max-w-full" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
        </div>
      </Card>

      <Card className="p-2 rounded-2xl border-border/40">
        <div className="flex gap-1.5 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-xl shrink-0" />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: tiles }).map((_, i) => (
          <Card key={i} className="p-4 rounded-2xl border-border/40 space-y-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </Card>
        ))}
      </div>
    </div>
  );
}
