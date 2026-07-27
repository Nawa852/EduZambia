import React, { useEffect } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface ToolSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  children: React.ReactNode;
}

/**
 * Full-screen iOS-style sheet used whenever a user opens a "tool".
 * Slides up from the bottom, frosted sticky header, rounded top corners.
 */
export const ToolSheet: React.FC<ToolSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative mt-3 sm:mt-8 flex-1 flex flex-col overflow-hidden',
          'rounded-t-[22px] sm:rounded-t-[26px] bg-background border-t border-border/60 shadow-2xl',
          'sm:mx-auto sm:w-full sm:max-w-5xl',
          'animate-in slide-in-from-bottom duration-300'
        )}
      >
        {/* grabber */}
        <div className="pt-2 flex justify-center shrink-0">
          <div className="h-1 w-9 rounded-full bg-muted-foreground/25" />
        </div>

        {/* header */}
        <div className="sticky top-0 z-10 px-2.5 sm:px-4 py-2 flex items-center gap-2 bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur-xl border-b border-border/40 shrink-0">
          <button
            onClick={onClose}
            className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-primary hover:bg-muted/60 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {Icon && (
              <span className="shrink-0 h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] truncate">{title}</h2>
                {badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-primary text-primary-foreground leading-none">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[11.5px] text-muted-foreground truncate leading-snug">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 sm:px-4 py-3 pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ToolSheet;
