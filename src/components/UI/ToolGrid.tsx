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

/** Soft iOS-style tints, cycled across tiles. Uses semantic tokens only. */
const TINTS = [
  'bg-primary/[0.08] border-primary/15 text-primary',
  'bg-accent/40 border-accent text-foreground',
  'bg-secondary/60 border-border/50 text-foreground',
  'bg-muted/70 border-border/50 text-foreground',
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {tools.map((tool, i) => (
          <button
            key={tool.id}
            onClick={() => onOpen(tool.id)}
            className={cn(
              'group relative text-left rounded-[18px] border p-3.5 min-h-[112px] flex flex-col',
              'transition-transform duration-200 active:scale-[0.97] hover:-translate-y-0.5',
              TINTS[i % TINTS.length]
            )}
          >
            {tool.badge && (
              <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-primary text-primary-foreground leading-none">
                {tool.badge}
              </span>
            )}
            <span className="h-9 w-9 rounded-[12px] bg-background/70 flex items-center justify-center mb-2.5 shrink-0">
              <tool.icon className="w-[18px] h-[18px] text-primary" />
            </span>
            <span className="text-[14px] font-semibold text-foreground leading-tight tracking-[-0.01em]">
              {tool.label}
            </span>
            {tool.description && (
              <span className="text-[11.5px] text-muted-foreground leading-snug mt-1 line-clamp-2">
                {tool.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};

export default ToolGrid;
