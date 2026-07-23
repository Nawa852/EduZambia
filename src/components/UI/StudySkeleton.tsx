import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/** Skeleton for the SchoolGoat-style study dashboard (tabs + table rows). */
export function StudyDashboardSkeleton() {
  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-6xl space-y-5 animate-in fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-3.5 w-80 max-w-full" />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Skeleton className="h-10 w-64 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
      </div>

      <Card className="rounded-2xl overflow-hidden border">
        <div className="hidden md:grid grid-cols-[1fr_120px_180px_40px] px-5 py-3 border-b bg-muted/30 gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-16" />
          <span />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_180px_40px] items-center gap-3 px-5 py-4 border-b last:border-0">
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-3.5 w-40 max-w-full" />
                <Skeleton className="h-3 w-24 md:hidden" />
              </div>
            </div>
            <Skeleton className="hidden md:block h-3 w-8" />
            <Skeleton className="hidden md:block h-3 w-24" />
            <Skeleton className="h-6 w-6 rounded-lg justify-self-end" />
          </div>
        ))}
      </Card>
    </div>
  );
}

/** Skeleton for the resource viewer (title + tab bar + document body). */
export function StudyResourceSkeleton() {
  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-6xl space-y-4 animate-in fade-in">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-60 max-w-full" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg shrink-0" />
        ))}
      </div>
      <Card className="p-5 rounded-2xl space-y-3 border-border/40">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </Card>
    </div>
  );
}

/** Skeleton for the course/folder page (header + tabs + resource list). */
export function StudyCourseSkeleton() {
  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-6xl space-y-4 animate-in fade-in">
      <Card className="p-4 lg:p-5 rounded-2xl border-border/40">
        <div className="flex items-center gap-3.5">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-52 max-w-full" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
        </div>
      </Card>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 rounded-2xl border-border/40 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </Card>
        ))}
      </div>
    </div>
  );
}
