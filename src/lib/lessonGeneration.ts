import type { SupabaseClient } from '@supabase/supabase-js';

type LessonClient = Pick<SupabaseClient, 'auth' | 'functions'>;
const signInMessage = 'Please sign in again to generate a lesson plan or scheme of work.';

/** Demo roles are not credentials: live generation requires a real session. */
export async function invokeLessonGenerator(client: LessonClient, body: Record<string, unknown>) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) throw new Error(signInMessage);
  let session = data.session;
  const refresh = async () => {
    const { data: refreshed, error: refreshError } = await client.auth.refreshSession();
    if (refreshError || !refreshed.session?.access_token) throw new Error(signInMessage);
    return refreshed.session;
  };
  if (session.expires_at && session.expires_at <= Math.floor(Date.now() / 1000) + 30) {
    session = await refresh();
  }
  const invoke = (token: string) => client.functions.invoke('ai-lesson-generator', {
    body, headers: { Authorization: `Bearer ${token}` },
  });
  let result = await invoke(session.access_token);
  if (result.error?.context?.status === 401) {
    session = await refresh();
    result = await invoke(session.access_token);
    if (result.error?.context?.status === 401) throw new Error(signInMessage);
  }
  return result;
}