import { useEffect, useRef } from 'react';
import { EVENTS, logEvent } from '@/lib/monitoring';

/**
 * Reports when a blocking loader ("Loading your experience…") stays visible
 * longer than `thresholdMs`, so launch regressions surface immediately.
 */
export function useLoadingWatchdog(active: boolean, label: string, thresholdMs = 6000) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      return;
    }

    startedAt.current = Date.now();
    timer.current = setTimeout(() => {
      void logEvent({
        type: EVENTS.LOADING_STUCK,
        severity: 'critical',
        message: `"${label}" still blocking after ${thresholdMs}ms`,
        durationMs: Date.now() - startedAt.current,
        metadata: { label },
      });
    }, thresholdMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [active, label, thresholdMs]);
}
