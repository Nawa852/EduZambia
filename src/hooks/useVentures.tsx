import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Venture {
  id: string;
  user_id: string;
  name: string;
  sector: string | null;
  stage: string;
  funding_status: string;
  funding_amount: number;
  progress: number;
  team_size: number;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessMilestone {
  id: string;
  venture_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  order_index: number;
  created_at: string;
}

export function useVentures() {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [milestones, setMilestones] = useState<BusinessMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVentures = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('ventures')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ventures:', error);
      return;
    }
    setVentures((data as any[]) || []);
  };

  const fetchMilestones = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('business_milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching milestones:', error);
      return;
    }
    setMilestones((data as any[]) || []);
  };

  const addVenture = async (venture: Omit<Venture, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error } = await supabase.from('ventures').insert({
      ...venture,
      user_id: user.id,
    } as any);

    if (error) {
      toast({ title: 'Error', description: 'Failed to add venture', variant: 'destructive' });
      return;
    }
    toast({ title: 'Success', description: 'Venture added!' });
    fetchVentures();
  };

  const updateVenture = async (id: string, updates: Partial<Venture>) => {
    const { error } = await supabase.from('ventures').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update venture', variant: 'destructive' });
      return;
    }
    fetchVentures();
  };

  const deleteVenture = async (id: string) => {
    const { error } = await supabase.from('ventures').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete venture', variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: 'Venture removed.' });
    fetchVentures();
    fetchMilestones();
  };

  const addMilestone = async (milestone: { venture_id: string; title: string; order_index?: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error } = await supabase.from('business_milestones').insert({
      ...milestone,
      user_id: user.id,
    } as any);

    if (error) {
      toast({ title: 'Error', description: 'Failed to add milestone', variant: 'destructive' });
      return;
    }
    fetchMilestones();
  };

  const toggleMilestone = async (id: string, completed: boolean) => {
    const { error } = await supabase.from('business_milestones').update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    } as any).eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update milestone', variant: 'destructive' });
      return;
    }
    fetchMilestones();
  };

  const deleteMilestone = async (id: string) => {
    const { error } = await supabase.from('business_milestones').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete milestone', variant: 'destructive' });
      return;
    }
    fetchMilestones();
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchVentures(), fetchMilestones()]).finally(() => setLoading(false));
  }, []);

  return {
    ventures, milestones, loading,
    addVenture, updateVenture, deleteVenture,
    addMilestone, toggleMilestone, deleteMilestone,
    refresh: () => Promise.all([fetchVentures(), fetchMilestones()]),
  };
}
