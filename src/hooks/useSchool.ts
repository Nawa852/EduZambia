import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface School {
  id: string; owner_id: string; name: string; emis_number: string | null; motto: string | null;
  address: string | null; logo_url: string | null; primary_color: string; secondary_color: string;
  school_code: string; staff_code: string;
}

/** The school the signed-in user owns or belongs to (branding flows from here). */
export function useSchool() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['my-school', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_my_school');
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as School | null;
    },
  });
  return {
    school: q.data ?? null,
    loading: q.isLoading,
    isOwner: !!q.data && q.data.owner_id === user?.id,
    refresh: () => qc.invalidateQueries({ queryKey: ['my-school'] }),
  };
}
