import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface StudentSnapshot {
  focus_minutes_today: number;
  focus_minutes_total: number;
  quizzes_taken: number;
  lessons_done: number;
  notes: number;
  resources: number;
  unread_notifications: number;
  streak: number;
}

const CACHE_KEY = 'synapse.student.snapshot';

const readCache = (): StudentSnapshot | undefined => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as StudentSnapshot) : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Every headline number on the student home in a single round-trip, with a
 * local cache so a returning student sees real figures before the network answers.
 */
export function useStudentSnapshot() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-snapshot', user?.id],
    enabled: !!user,
    staleTime: 30_000,
    placeholderData: readCache(),
    queryFn: async (): Promise<StudentSnapshot> => {
      const { data, error } = await supabase.rpc('get_student_home_snapshot');
      if (error) throw error;
      const snap = data as unknown as StudentSnapshot;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(snap)); } catch { /* private mode */ }
      return snap;
    },
  });
}
