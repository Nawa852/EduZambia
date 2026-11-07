import { test, expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { invokeLessonGenerator } from '../../src/lib/lessonGeneration';

function fixture(options: { missing?: boolean; expired?: boolean; statuses?: number[]; refreshFails?: boolean } = {}) {
  const calls: string[] = [];
  let refreshes = 0;
  const session = { access_token: 'initial-test-token', expires_at: Math.floor(Date.now() / 1000) + (options.expired ? -10 : 3600) };
  const client = {
    auth: {
      getSession: async () => ({ data: { session: options.missing ? null : session }, error: null }),
      refreshSession: async () => {
        refreshes++;
        return { data: { session: options.refreshFails ? null : { ...session, access_token: 'refreshed-test-token' } }, error: null };
      },
    },
    functions: {
      invoke: async (_name: string, request: { headers: { Authorization: string } }) => {
        calls.push(request.headers.Authorization);
        const status = options.statuses?.[calls.length - 1] ?? 200;
        return status === 200 ? { data: { lessonPlan: 'A generated plan' }, error: null } : { data: null, error: { context: { status } } };
      },
    },
  };
  return { client: client as unknown as SupabaseClient, calls, refreshes: () => refreshes };
}

test('missing sessions do not call live AI', async () => {
  const f = fixture({ missing: true });
  await expect(invokeLessonGenerator(f.client, {})).rejects.toThrow('Please sign in again');
  expect(f.calls).toHaveLength(0);
});

test('valid sessions send the user bearer token', async () => {
  const f = fixture();
  const result = await invokeLessonGenerator(f.client, { topic: 'Algebra' });
  expect(result.data.lessonPlan).toBe('A generated plan');
  expect(f.calls).toEqual(['Bearer initial-test-token']);
  expect(f.refreshes()).toBe(0);
});

test('expired sessions refresh before sending a request', async () => {
  const f = fixture({ expired: true });
  await invokeLessonGenerator(f.client, {});
  expect(f.calls).toEqual(['Bearer refreshed-test-token']);
  expect(f.refreshes()).toBe(1);
});

test('401 refreshes and retries with the new token once', async () => {
  const f = fixture({ statuses: [401, 200] });
  await invokeLessonGenerator(f.client, {});
  expect(f.calls).toEqual(['Bearer initial-test-token', 'Bearer refreshed-test-token']);
  expect(f.refreshes()).toBe(1);
});

test('persistent 401 never retries indefinitely', async () => {
  const f = fixture({ statuses: [401, 401] });
  await expect(invokeLessonGenerator(f.client, {})).rejects.toThrow('Please sign in again');
  expect(f.calls).toHaveLength(2);
  expect(f.refreshes()).toBe(1);
});

test('failed refresh does not resend an unauthorized request', async () => {
  const f = fixture({ statuses: [401], refreshFails: true });
  await expect(invokeLessonGenerator(f.client, {})).rejects.toThrow('Please sign in again');
  expect(f.calls).toHaveLength(1);
});

test('non-auth errors are not retried', async () => {
  const f = fixture({ statuses: [429] });
  const result = await invokeLessonGenerator(f.client, {});
  expect(result.error?.context.status).toBe(429);
  expect(f.calls).toHaveLength(1);
  expect(f.refreshes()).toBe(0);
});