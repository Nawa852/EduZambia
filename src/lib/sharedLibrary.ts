import { supabase } from '@/integrations/supabase/client';

export const LIBRARY_BUCKET = 'shared-library';

export type LibraryCategory =
  | 'lesson_plan'
  | 'scheme_of_work'
  | 'notes'
  | 'past_paper'
  | 'quiz'
  | 'textbook'
  | 'video'
  | 'other';

export const LIBRARY_CATEGORIES: { value: LibraryCategory; label: string }[] = [
  { value: 'lesson_plan', label: 'Lesson plans' },
  { value: 'scheme_of_work', label: 'Schemes of work' },
  { value: 'notes', label: 'Notes' },
  { value: 'past_paper', label: 'Past papers' },
  { value: 'quiz', label: 'Quizzes & tests' },
  { value: 'textbook', label: 'Textbooks' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Other' },
];

export const categoryLabel = (value?: string | null) =>
  LIBRARY_CATEGORIES.find((c) => c.value === value)?.label ?? 'Other';

export interface LibraryItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: LibraryCategory;
  subject: string | null;
  grade_level: string | null;
  kind: string;
  bucket: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  tags: string[] | null;
  is_public: boolean;
  downloads: number;
  created_at: string;
}

export interface LibraryFilters {
  scope?: 'shared' | 'mine';
  category?: LibraryCategory | 'all';
  subject?: string;
  grade?: string;
  search?: string;
}

function kindFromFile(file: File): string {
  const type = file.type || '';
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['ppt', 'pptx'].includes(ext)) return 'slides';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) return 'document';
  return 'other';
}

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-90);

export async function listLibrary(filters: LibraryFilters = {}): Promise<LibraryItem[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData?.session?.user?.id;

  let q = supabase
    .from('resource_repository')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  if (filters.scope === 'mine' && uid) q = q.eq('user_id', uid);
  else q = q.eq('is_public', true);

  if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category);
  if (filters.subject) q = q.eq('subject', filters.subject);
  if (filters.grade) q = q.eq('grade_level', filters.grade);
  if (filters.search) q = q.ilike('title', `%${filters.search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as LibraryItem[];
}

export interface LibraryUpload {
  file: File;
  title?: string;
  description?: string;
  category: LibraryCategory;
  subject?: string;
  grade?: string;
  tags?: string[];
  shared: boolean;
}

export async function uploadToLibrary(opts: LibraryUpload): Promise<LibraryItem> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) throw new Error('Sign in to upload to the library.');

  const kind = kindFromFile(opts.file);
  const folderPath = `${opts.category}/${opts.subject || 'General'}`;
  const storagePath = `${user.id}/${folderPath}/${Date.now()}-${safeName(opts.file.name)}`;

  const { error: upErr } = await supabase.storage
    .from(LIBRARY_BUCKET)
    .upload(storagePath, opts.file, { upsert: false, contentType: opts.file.type || undefined });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { data, error } = await supabase
    .from('resource_repository')
    .insert({
      user_id: user.id,
      title: opts.title?.trim() || opts.file.name,
      description: opts.description ?? null,
      category: opts.category,
      kind,
      subject: opts.subject || null,
      grade_level: opts.grade || null,
      folder_path: folderPath,
      bucket: LIBRARY_BUCKET,
      storage_path: storagePath,
      mime_type: opts.file.type || null,
      size_bytes: opts.file.size,
      tags: opts.tags ?? [],
      source: 'library-upload',
      is_public: opts.shared,
    })
    .select('*')
    .single();

  if (error) {
    await supabase.storage.from(LIBRARY_BUCKET).remove([storagePath]);
    throw new Error(`Could not save resource: ${error.message}`);
  }
  return data as unknown as LibraryItem;
}

export async function getLibraryUrl(item: Pick<LibraryItem, 'bucket' | 'storage_path'>) {
  const { data, error } = await supabase.storage
    .from(item.bucket)
    .createSignedUrl(item.storage_path, 60 * 60);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

export async function downloadLibraryItem(item: LibraryItem) {
  const url = await getLibraryUrl(item);
  if (!url) throw new Error('Could not open that file.');
  await supabase.rpc('increment_resource_download', { _resource_id: item.id });
  window.open(url, '_blank', 'noopener,noreferrer');
  return url;
}

export async function setLibraryVisibility(id: string, shared: boolean) {
  const { error } = await supabase.from('resource_repository').update({ is_public: shared }).eq('id', id);
  if (error) throw error;
}

export async function deleteLibraryItem(item: LibraryItem) {
  await supabase.storage.from(item.bucket).remove([item.storage_path]);
  const { error } = await supabase.from('resource_repository').delete().eq('id', item.id);
  if (error) throw error;
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
