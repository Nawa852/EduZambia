import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';

export type ResourceType = 'notes' | 'lesson_plan' | 'worksheet' | 'past_paper' | 'video' | 'link' | 'other';
export type Visibility = 'private' | 'public' | 'school';

export interface TeachingResource {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  resource_type: ResourceType;
  file_url: string | null;
  external_url: string | null;
  source: string | null;
  tags: string[] | null;
  visibility: Visibility;
  downloads: number;
  created_at: string;
}

export interface ResourceFilters {
  subject?: string;
  grade?: string;
  type?: ResourceType;
  scope?: 'all' | 'mine' | 'public';
  search?: string;
}

export function useTeachingResources(filters: ResourceFilters = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState<TeachingResource[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('teaching_resources').select('*').order('created_at', { ascending: false }).limit(200);
    if (filters.subject) q = q.eq('subject', filters.subject);
    if (filters.grade) q = q.eq('grade_level', filters.grade);
    if (filters.type) q = q.eq('resource_type', filters.type);
    if (filters.scope === 'mine' && user) q = q.eq('owner_id', user.id);
    if (filters.scope === 'public') q = q.eq('visibility', 'public');
    if (filters.search) q = q.ilike('title', `%${filters.search}%`);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems((data || []) as TeachingResource[]);
    setLoading(false);
  }, [filters.subject, filters.grade, filters.type, filters.scope, filters.search, user]);

  useEffect(() => { load(); }, [load]);

  const create = async (payload: Partial<TeachingResource>) => {
    if (!user) { toast.error('Sign in to publish'); return null; }
    const { data, error } = await supabase.from('teaching_resources').insert({
      owner_id: user.id,
      title: payload.title || 'Untitled',
      description: payload.description ?? null,
      subject: payload.subject ?? null,
      grade_level: payload.grade_level ?? null,
      resource_type: payload.resource_type || 'notes',
      file_url: payload.file_url ?? null,
      external_url: payload.external_url ?? null,
      source: payload.source || 'own',
      tags: payload.tags ?? [],
      visibility: payload.visibility || 'private',
    }).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Resource saved');
    await load();
    return data as TeachingResource;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('teaching_resources').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const update = async (id: string, patch: Partial<TeachingResource>) => {
    const { error } = await supabase.from('teaching_resources').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Updated');
    await load();
  };

  const uploadFile = async (file: File, folder = 'teaching'): Promise<string | null> => {
    if (!user) { toast.error('Sign in to upload'); return null; }
    const path = `${folder}/${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
    return data.publicUrl;
  };

  return { items, loading, create, remove, update, uploadFile, reload: load };
}

// Specializations
export interface Specialization {
  id: string;
  user_id: string;
  subject: string;
  grade_levels: string[];
  years_experience: number;
  qualifications: string | null;
  bio: string | null;
}

export function useTeacherSpecializations(userId?: string) {
  const { user } = useAuth();
  const target = userId || user?.id;
  const [items, setItems] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!target) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from('teacher_specializations').select('*').eq('user_id', target).order('created_at');
    if (error) toast.error(error.message);
    setItems((data || []) as Specialization[]);
    setLoading(false);
  }, [target]);

  useEffect(() => { load(); }, [load]);

  const add = async (payload: Omit<Specialization, 'id' | 'user_id'>) => {
    if (!user) return null;
    const { error } = await supabase.from('teacher_specializations').upsert({ ...payload, user_id: user.id }, { onConflict: 'user_id,subject' });
    if (error) { toast.error(error.message); return null; }
    toast.success('Specialization saved');
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('teacher_specializations').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return { items, loading, add, remove, reload: load };
}
