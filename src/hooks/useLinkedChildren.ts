import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

/** Statuses that mean "this guardian really is connected to this child". */
export const LINKED_STATUSES = ['accepted', 'active'];

export interface LinkedChild {
  linkId: string;
  studentId: string;
  name: string;
  grade: string | null;
  school: string | null;
  relationship: string | null;
}

/**
 * One source of truth for "who are my children" across every guardian page,
 * so a link created with one status never disappears on another screen.
 */
export function useLinkedChildren() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['linked-children', user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<LinkedChild[]> => {
      const { data: links } = await supabase
        .from('guardian_links')
        .select('id, student_id, relationship, status')
        .eq('guardian_id', user!.id)
        .in('status', LINKED_STATUSES);

      const rows = (links ?? []).filter((l) => !!l.student_id);
      if (rows.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, grade, school')
        .in('id', rows.map((r) => r.student_id));

      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      return rows.map((r) => {
        const p = byId.get(r.student_id);
        return {
          linkId: r.id,
          studentId: r.student_id,
          name: p?.full_name || 'Your child',
          grade: (p?.grade as string) ?? null,
          school: (p?.school as string) ?? null,
          relationship: r.relationship,
        };
      });
    },
  });
}
