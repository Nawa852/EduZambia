import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Shared design-system header used across hubs and feature pages.
 * Ensures consistent spacing, typography, and accent treatment.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  actions,
  className,
}) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl bg-card border border-border/20 mb-4 lg:mb-5',
      className,
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.04]" />
    <div className="relative px-4 py-4 lg:px-6 lg:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5 min-w-0">
        {Icon && (
          <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/5">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg lg:text-xl font-bold text-foreground leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] text-muted-foreground mt-0.5 max-w-md leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  </div>
);

export default PageHeader;
