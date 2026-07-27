import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared Apple-style segmented navigation used across hub and study pages.
 * Frosted sticky container + pill triggers with an underline indicator.
 */

export const segmentedBarClass =
  'sticky top-14 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-1 bg-nav/85 supports-[backdrop-filter]:bg-nav/70 backdrop-blur-xl border-b border-border/50';


export const segmentedListClass =
  'flex gap-0.5 overflow-x-auto scrollbar-none snap-x min-w-full';

export function segmentedTriggerClass(active: boolean) {
  return cn(
    'relative snap-start shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-[12px]',
    'text-[12.5px] sm:text-[13px] transition-colors whitespace-nowrap',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
    'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-full after:bg-primary after:transition-all',
    active
      ? 'bg-card text-primary font-semibold shadow-sm after:w-5'
      : 'text-muted-foreground hover:text-foreground font-medium after:w-0'
  );
}

interface SegmentedBarProps {
  label: string;
  children: React.ReactNode;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  className?: string;
  trailing?: React.ReactNode;
}

export const SegmentedBar: React.FC<SegmentedBarProps> = ({
  label,
  children,
  onKeyDown,
  className,
  trailing,
}) => (
  <div className={cn(segmentedBarClass, className)}>
    <div className="flex items-center gap-2">
      <div role="tablist" aria-label={label} className={segmentedListClass} onKeyDown={onKeyDown}>
        {children}
      </div>
      {trailing}
    </div>
  </div>
);
