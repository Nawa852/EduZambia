import { supabase } from '@/integrations/supabase/client';

export type Severity = 'info' | 'warning' | 'error' | 'critical';

export interface MonitorEvent {
  type: string;
  severity?: Severity;
  message?: string;
  route?: string;
  role?: string | null;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

/** Well-known event types we alert on. */
export const EVENTS = {
  AUTH_HANG: 'auth.session_hang',
  AUTH_BOOTSTRAP_FAILSAFE: 'auth.bootstrap_failsafe',
  LOADING_STUCK: 'ui.loading_experience_stuck',
  ARTIFACT_FAILED: 'artifact.generation_failed',
  ARTIFACT_SLOW: 'artifact.generation_slow',
  ROUTE_ERROR: 'ui.route_error',
} as const;

const recentlySent = new Map<string, number>();
const DEDUPE_MS = 30_000;

function shouldSend(key: string) {
  const now = Date.now();
  const last = recentlySent.get(key);
  if (last && now - last < DEDUPE_MS) return false;
  recentlySent.set(key, now);
  return true;
}

/** Fire-and-forget health event. Never throws, never blocks the UI. */
export async function logEvent(evt: MonitorEvent): Promise<void> {
  try {
    const key = `${evt.type}|${evt.route ?? ''}|${evt.message ?? ''}`;
    if (!shouldSend(key)) return;

    const payload = {
      event_type: evt.type,
      severity: evt.severity ?? 'info',
      message: evt.message ?? null,
      route: evt.route ?? (typeof window !== 'undefined' ? window.location.pathname : null),
      role: evt.role ?? null,
      duration_ms: evt.durationMs ?? null,
      metadata: (evt.metadata ?? {}) as Record<string, unknown>,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 400) : null,
    };

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id ?? null;

    // Server-side ingest also escalates repeated events into alerts.
    const { error } = await supabase.functions.invoke('monitor-ingest', { body: payload });
    if (error) {
      await supabase.from('system_events').insert({ ...payload, user_id: userId } as never);
    }
  } catch {
    /* monitoring must never break the app */
  }
}

export function logError(type: string, err: unknown, extra?: Partial<MonitorEvent>) {
  const message = err instanceof Error ? err.message : String(err);
  return logEvent({ type, severity: 'error', message: message.slice(0, 500), ...extra });
}

/**
 * Measures an async operation and reports failures / slowness.
 */
export async function measure<T>(
  type: string,
  fn: () => Promise<T>,
  opts: { slowMs?: number; slowType?: string; metadata?: Record<string, unknown> } = {},
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    if (opts.slowMs && durationMs > opts.slowMs) {
      void logEvent({
        type: opts.slowType ?? `${type}.slow`,
        severity: 'warning',
        durationMs,
        metadata: opts.metadata,
      });
    }
    return result;
  } catch (err) {
    void logError(type, err, { durationMs: Date.now() - start, metadata: opts.metadata });
    throw err;
  }
}

let globalHandlersInstalled = false;

/** Installs window-level error + unhandled rejection reporting. */
export function installGlobalMonitoring() {
  if (globalHandlersInstalled || typeof window === 'undefined') return;
  globalHandlersInstalled = true;

  window.addEventListener('error', (e) => {
    void logEvent({
      type: EVENTS.ROUTE_ERROR,
      severity: 'error',
      message: String(e.message).slice(0, 500),
      metadata: { source: e.filename, line: e.lineno },
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = (e as PromiseRejectionEvent).reason;
    void logEvent({
      type: EVENTS.ROUTE_ERROR,
      severity: 'error',
      message: (reason instanceof Error ? reason.message : String(reason)).slice(0, 500),
      metadata: { kind: 'unhandledrejection' },
    });
  });
}
