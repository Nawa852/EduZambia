import { supabase } from '@/integrations/supabase/client';

export type ResourceKind = 'document' | 'image' | 'video' | 'audio' | 'slides' | 'spreadsheet' | 'pdf' | 'other';

export interface RepositoryItem {
  id: string;
  title: string;
  kind: ResourceKind;
  subject: string | null;
  folder_path: string;
  bucket: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  tags: string[];
  source: string | null;
  is_public: boolean;
  created_at: string;
}

export function detectKind(file: { type?: string; name: string }): ResourceKind {
  const type = file.type ?? '';
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (ext === 'pdf' || type === 'application/pdf') return 'pdf';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'slides';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
  if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) return 'document';
  return 'other';
}

const KIND_FOLDER: Record<ResourceKind, string> = {
  pdf: 'Documents',
  document: 'Documents',
  slides: 'Presentations',
  spreadsheet: 'Data',
  image: 'Images',
  video: 'Videos',
  audio: 'Audio',
  other: 'Other',
};

/** The system arranges every upload: Role / Subject / Kind. */
export function buildFolderPath(opts: { role?: string | null; subject?: string | null; kind: ResourceKind }): string {
  const segments = [
    (opts.role ?? 'general').replace(/[^a-z0-9-]/gi, ''),
    (opts.subject ?? 'Unsorted').trim() || 'Unsorted',
    KIND_FOLDER[opts.kind],
  ];
  return segments.join('/');
}

function slug(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
}

export interface UploadOptions {
  file: File;
  title?: string;
  subject?: string | null;
  role?: string | null;
  tags?: string[];
  source?: string;
  isPublic?: boolean;
  bucket?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Single entry point for ALL uploads in the app.
 * Stores the binary in Storage and registers it in the resource repository,
 * auto-organised into Role / Subject / Kind folders.
 */
export async function uploadToRepository(opts: UploadOptions): Promise<RepositoryItem> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) throw new Error('You need to be signed in to upload resources.');

  const bucket = opts.bucket ?? 'uploads';
  const kind = detectKind(opts.file);
  const folderPath = buildFolderPath({ role: opts.role, subject: opts.subject, kind });
  const storagePath = `${user.id}/${folderPath}/${Date.now()}-${slug(opts.file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, opts.file, { upsert: false, contentType: opts.file.type || undefined });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data, error } = await supabase
    .from('resource_repository')
    .insert({
      user_id: user.id,
      title: opts.title?.trim() || opts.file.name,
      kind,
      subject: opts.subject ?? null,
      folder_path: folderPath,
      bucket,
      storage_path: storagePath,
      mime_type: opts.file.type || null,
      size_bytes: opts.file.size,
      tags: opts.tags ?? [],
      source: opts.source ?? 'manual-upload',
      is_public: opts.isPublic ?? false,
      metadata: (opts.metadata ?? {}) as never,
    })
    .select('*')
    .single();

  if (error) {
    await supabase.storage.from(bucket).remove([storagePath]);
    throw new Error(`Could not register resource: ${error.message}`);
  }
  return data as unknown as RepositoryItem;
}

export async function listRepository(folderPath?: string): Promise<RepositoryItem[]> {
  let query = supabase.from('resource_repository').select('*').order('created_at', { ascending: false });
  if (folderPath) query = query.like('folder_path', `${folderPath}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as RepositoryItem[];
}

export async function getResourceUrl(item: Pick<RepositoryItem, 'bucket' | 'storage_path'>): Promise<string | null> {
  const { data } = await supabase.storage.from(item.bucket).createSignedUrl(item.storage_path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function deleteResource(item: RepositoryItem): Promise<void> {
  await supabase.storage.from(item.bucket).remove([item.storage_path]);
  await supabase.from('resource_repository').delete().eq('id', item.id);
}

/** Groups items into a folder tree for display. */
export function groupByFolder(items: RepositoryItem[]): Record<string, RepositoryItem[]> {
  return items.reduce<Record<string, RepositoryItem[]>>((acc, item) => {
    (acc[item.folder_path] ||= []).push(item);
    return acc;
  }, {});
}
