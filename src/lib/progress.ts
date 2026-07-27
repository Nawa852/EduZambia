import { supabase } from '@/integrations/supabase/client';

/**
 * Universal progress persistence for AI workspace + study tools.
 * Every tool (chat, artifact, study pack, quiz, solver, voice note…) can save a
 * resumable snapshot keyed by `kind` + `refKey`.
 */
export type ProgressKind =
  | 'chat'
  | 'artifact'
  | 'study_pack'
  | 'quiz'
  | 'homework'
  | 'exam_predictor'
  | 'voice_note'
  | 'flashcards'
  | 'tutor';

export interface ProgressSnapshot<T = any> {
  id: string;
  kind: ProgressKind | string;
  ref_key: string;
  title: string;
  payload: T;
  progress: number;
  created_at: string;
  updated_at: string;
}

export async function saveProgress<T>(args: {
  kind: ProgressKind | string;
  refKey: string;
  title: string;
  payload: T;
  progress?: number;
}): Promise<ProgressSnapshot<T> | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_progress_snapshots')
    .upsert(
      {
        user_id: userId,
        kind: args.kind,
        ref_key: args.refKey,
        title: args.title,
        payload: args.payload as any,
        progress: Math.max(0, Math.min(100, args.progress ?? 0)),
      },
      { onConflict: 'user_id,kind,ref_key' },
    )
    .select('*')
    .single();

  if (error) return null;
  return data as unknown as ProgressSnapshot<T>;
}

export async function loadProgress<T>(kind: string, refKey: string): Promise<ProgressSnapshot<T> | null> {
  const { data, error } = await supabase
    .from('user_progress_snapshots')
    .select('*')
    .eq('kind', kind)
    .eq('ref_key', refKey)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as ProgressSnapshot<T>;
}

export async function listProgress(kind?: string, limit = 30): Promise<ProgressSnapshot[]> {
  let query = supabase
    .from('user_progress_snapshots')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (kind) query = query.eq('kind', kind);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as unknown as ProgressSnapshot[];
}

export async function deleteProgress(id: string): Promise<boolean> {
  const { error } = await supabase.from('user_progress_snapshots').delete().eq('id', id);
  return !error;
}

/** Debounced autosave helper — call the returned function as often as you like. */
export function createAutosave(delayMs = 1500) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (args: Parameters<typeof saveProgress>[0]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { void saveProgress(args); }, delayMs);
  };
}
