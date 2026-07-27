import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from '@/hooks/use-toast';

export interface DeveloperProject {
  id: string;
  user_id: string;
  name: string;
  language: string | null;
  description: string | null;
  repo_url: string | null;
  progress: number;
  status: string;
  created_at: string;
}

export function useDeveloperProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<DeveloperProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('developer_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error loading projects', description: error.message, variant: 'destructive' });
    } else {
      setProjects((data as DeveloperProject[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const addProject = async (project: { name: string; language?: string; description?: string; repo_url?: string }) => {
    if (!user) { setLoading(false); return; }
    const { error } = await supabase.from('developer_projects').insert({ ...project, user_id: user.id });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Project created!' });
      fetchProjects();
    }
  };

  const updateProject = async (id: string, updates: Partial<DeveloperProject>) => {
    const { error } = await supabase.from('developer_projects').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchProjects();
    }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('developer_projects').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Project deleted' });
      fetchProjects();
    }
  };

  return { projects, loading, addProject, updateProject, deleteProject, refetch: fetchProjects };
}
