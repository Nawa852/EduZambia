import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from '@/hooks/use-toast';

export interface VentureFinancial {
  id: string;
  venture_id: string | null;
  user_id: string;
  type: string;
  category: string | null;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

export function useVentureFinancials(ventureId?: string) {
  const { user } = useAuth();
  const [financials, setFinancials] = useState<VentureFinancial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFinancials = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    let query = supabase.from('venture_financials').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false });
    if (ventureId) query = query.eq('venture_id', ventureId);
    const { data, error } = await query;
    if (error) {
      toast({ title: 'Error loading financials', description: error.message, variant: 'destructive' });
    } else {
      setFinancials((data as VentureFinancial[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFinancials(); }, [user, ventureId]);

  const totalRevenue = financials.filter(f => f.type === 'revenue').reduce((s, f) => s + Number(f.amount), 0);
  const totalExpenses = financials.filter(f => f.type === 'expense').reduce((s, f) => s + Number(f.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const addFinancial = async (entry: { venture_id?: string; type: string; category?: string; amount: number; description?: string; transaction_date: string }) => {
    if (!user) { setLoading(false); return; }
    const { error } = await supabase.from('venture_financials').insert({ ...entry, user_id: user.id });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Transaction added!' });
      fetchFinancials();
    }
  };

  const deleteFinancial = async (id: string) => {
    const { error } = await supabase.from('venture_financials').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Transaction deleted' });
      fetchFinancials();
    }
  };

  return { financials, loading, totalRevenue, totalExpenses, netProfit, addFinancial, deleteFinancial, refetch: fetchFinancials };
}
