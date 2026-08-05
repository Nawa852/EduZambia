import { supabase } from '@/integrations/supabase/client';

/** A folder in the notes workspace sidebar. */
export interface NoteFolder {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  position: number;
  created_at: string;
}

/** A single note / page. */
export interface WorkspaceNote {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  icon: string;
  cover: string | null;
  folder_id: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  tags: string[];
  word_count: number;
  position: number;
  course_id: string | null;
  lesson_id: string | null;
  resource_id: string | null;
  created_at: string;
  updated_at: string;
}

export const FOLDER_COLORS = [
  { value: 'blue', dot: 'bg-primary' },
  { value: 'green', dot: 'bg-emerald-500' },
  { value: 'amber', dot: 'bg-amber-500' },
  { value: 'rose', dot: 'bg-rose-500' },
  { value: 'violet', dot: 'bg-violet-500' },
  { value: 'slate', dot: 'bg-muted-foreground' },
];

export const NOTE_ICONS = [
  '📄', '📘', '🧠', '🧪', '🧮', '📝', '📊', '🌍', '⚗️', '🔬',
  '💡', '🎯', '📌', '⭐', '🗂️', '✍️', '🧾', '🕹️', '🎓', '🔥',
];

export const COVER_PRESETS = [
  { id: 'none', label: 'None', className: '' },
  { id: 'blue', label: 'Ocean', className: 'bg-gradient-to-r from-primary/70 via-primary/40 to-primary/10' },
  { id: 'sunset', label: 'Sunset', className: 'bg-gradient-to-r from-amber-500/70 via-rose-500/40 to-violet-500/30' },
  { id: 'forest', label: 'Forest', className: 'bg-gradient-to-r from-emerald-600/70 via-emerald-400/40 to-teal-300/20' },
  { id: 'graphite', label: 'Graphite', className: 'bg-gradient-to-r from-foreground/40 via-foreground/20 to-foreground/5' },
];

export const coverClass = (cover?: string | null) =>
  COVER_PRESETS.find((c) => c.id === cover)?.className ?? '';

export const countWords = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

/** Plain-text preview of a markdown note, for cards and AI context. */
export const notePreview = (content: string, length = 160) =>
  content
    .replace(/[#*_`>~-]/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, length);

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data?.session?.user?.id;
  if (!id) throw new Error('Sign in to use your notes.');
  return id;
}

/* ------------------------------------------------------------------ folders */

export async function listFolders(): Promise<NoteFolder[]> {
  const { data, error } = await supabase
    .from('note_folders')
    .select('*')
    .order('position')
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as unknown as NoteFolder[];
}

export async function createFolder(name: string, color = 'blue'): Promise<NoteFolder> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from('note_folders')
    .insert({ user_id, name: name.trim() || 'New folder', color })
    .select('*')
    .single();
  if (error) throw error;
  return data as unknown as NoteFolder;
}

export async function renameFolder(id: string, name: string) {
  const { error } = await supabase.from('note_folders').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteFolder(id: string) {
  const { error } = await supabase.from('note_folders').delete().eq('id', id);
  if (error) throw error;
}

/* -------------------------------------------------------------------- notes */

export async function listNotes(includeArchived = false): Promise<WorkspaceNote[]> {
  let q = supabase
    .from('student_notes')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (!includeArchived) q = q.eq('is_archived', false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as WorkspaceNote[];
}

export async function createNote(patch: Partial<WorkspaceNote> = {}): Promise<WorkspaceNote> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from('student_notes')
    .insert({
      user_id,
      title: patch.title ?? 'Untitled',
      content: patch.content ?? '',
      icon: patch.icon ?? '📄',
      folder_id: patch.folder_id ?? null,
      cover: patch.cover ?? null,
      tags: patch.tags ?? [],
      word_count: countWords(patch.content ?? ''),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as unknown as WorkspaceNote;
}

export async function updateNote(id: string, patch: Partial<WorkspaceNote>) {
  const payload: Record<string, unknown> = { ...patch };
  if (typeof patch.content === 'string') payload.word_count = countWords(patch.content);
  delete payload.id;
  delete payload.user_id;
  delete payload.created_at;
  const { error } = await supabase.from('student_notes').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('student_notes').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Builds the text context the AI tools use when a student points them at a
 * folder ("use my Biology folder"). Truncated so the prompt stays sane.
 */
export function buildFolderContext(notes: WorkspaceNote[], limit = 12000): string {
  const chunks = notes.map(
    (n) => `## ${n.title || 'Untitled'}\n${n.content.trim()}`.slice(0, 4000),
  );
  let out = '';
  for (const chunk of chunks) {
    if (out.length + chunk.length > limit) break;
    out += `${chunk}\n\n`;
  }
  return out.trim();
}
