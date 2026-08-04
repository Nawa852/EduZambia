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

/** Soft iOS-style tints, cycled across tiles. */
const TINTS = [
  { card: 'bg-blue-500/[0.07] border-blue-500/15', icon: 'bg-blue-500/12 text-blue-600' },
  { card: 'bg-violet-500/[0.07] border-violet-500/15', icon: 'bg-violet-500/12 text-violet-600' },
  { card: 'bg-emerald-500/[0.07] border-emerald-500/15', icon: 'bg-emerald-500/12 text-emerald-600' },
  { card: 'bg-amber-500/[0.07] border-amber-500/15', icon: 'bg-amber-500/12 text-amber-600' },
  { card: 'bg-rose-500/[0.07] border-rose-500/15', icon: 'bg-rose-500/12 text-rose-600' },
  { card: 'bg-teal-500/[0.07] border-teal-500/15', icon: 'bg-teal-500/12 text-teal-600' },
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
    <section className={cn('space-y-3', className)}>
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase px-0.5">
        {title}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 lg:gap-3">
        {tools.map((tool, i) => {
          const tint = TINTS[i % TINTS.length];
          return (
            <button
              key={tool.id}
              onClick={() => onOpen(tool.id)}
              className={cn(
                'group relative text-left rounded-[20px] border p-4 min-h-[124px] flex flex-col',
                'transition-all duration-200 active:scale-[0.97] hover:-translate-y-0.5 hover:shadow-elevated',
                tint.card,
              )}
            >
              {tool.badge && (
                <span className="absolute top-3 right-3 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-primary text-primary-foreground leading-none">
                  {tool.badge}
                </span>
              )}
              <span className={cn('h-10 w-10 rounded-[14px] flex items-center justify-center mb-3 shrink-0 transition-transform group-hover:scale-105', tint.icon)}>
                <tool.icon className="w-[18px] h-[18px]" />
              </span>
              <span className="text-[14.5px] font-bold text-foreground leading-tight tracking-[-0.015em]">
                {tool.label}
              </span>
              {tool.description && (
                <span className="text-[11.5px] text-muted-foreground leading-snug mt-1 line-clamp-2">
                  {tool.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};


export default ToolGrid;
