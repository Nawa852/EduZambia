/**
 * Loading guards — nothing in Synapse should ever spin for more than a few seconds.
 * Every data load races a deadline; when the deadline wins we surface what we have
 * (usually an empty/partial state plus a retry) instead of an endless skeleton.
 */

export const FAST_TIMEOUT = 5000;
export const MAX_TIMEOUT = 7000;

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/** Reject if `promise` has not settled within `ms`. */
export function withTimeout<T>(promise: PromiseLike<T>, ms = MAX_TIMEOUT): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError(ms)), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

/** Resolve to `fallback` instead of throwing when the deadline is hit. */
export async function softTimeout<T>(promise: PromiseLike<T>, fallback: T, ms = MAX_TIMEOUT): Promise<T> {
  try {
    return await withTimeout(promise, ms);
  } catch {
    return fallback;
  }
}

/** Run several independent loads in parallel, each with its own deadline. */
export function allSoft<T extends readonly PromiseLike<unknown>[]>(
  promises: T,
  ms = MAX_TIMEOUT,
): Promise<{ [K in keyof T]: Awaited<T[K]> | null }> {
  return Promise.all(
    promises.map((p) => softTimeout(p as PromiseLike<unknown>, null, ms)),
  ) as any;
}

/** AbortSignal that fires after `ms` — for fetch/edge-function calls. */
export function timeoutSignal(ms = MAX_TIMEOUT): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}
