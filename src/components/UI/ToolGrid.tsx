import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface ToolTile {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  badge?: string;
}

/** Subtle monochrome icon tints, cycled across tiles (Apple-style restraint). */
const TINTS = [
  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'bg-teal-500/10 text-teal-600 dark:text-teal-400',
];

interface ToolGridProps {
  title?: string;
  tools: ToolTile[];
  onOpen: (id: string) => void;
  className?: string;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ title = 'Tools', tools, onOpen, className }) => {
  if (!tools.length) return null;
  return (
    <section className={cn('space-y-2.5', className)}>
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase px-0.5">
        {title}
      </h2>
      {/* Grouped list card — calmer than a wall of coloured tiles */}
      <div className="rounded-[18px] bg-card border border-border/50 overflow-hidden divide-y divide-border/40">
        {tools.map((tool, i) => (
          <button
            key={tool.id}
            onClick={() => onOpen(tool.id)}
            className="w-full text-left flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-secondary/50 active:bg-secondary"
          >
            <span className={cn('h-9 w-9 rounded-[11px] flex items-center justify-center shrink-0', TINTS[i % TINTS.length])}>
              <tool.icon className="w-[17px] h-[17px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-foreground tracking-[-0.01em] truncate">
                  {tool.label}
                </span>
                {tool.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-primary text-primary-foreground leading-none shrink-0">
                    {tool.badge}
                  </span>
                )}
              </span>
              {tool.description && (
                <span className="block text-[11.5px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">
                  {tool.description}
                </span>
              )}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          </button>
        ))}
      </div>
    </section>
  );
};



export default ToolGrid;
