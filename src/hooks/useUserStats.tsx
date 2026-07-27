import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export interface UserStats {
  xp: number;
  level: number;
  edu_coins: number;
  total_focus_minutes: number;
  total_lessons_completed: number;
  total_quizzes_passed: number;
  longest_streak: number;
  current_streak: number;
  last_activity_date: string | null;
}

const DEFAULT: UserStats = {
  xp: 0, level: 1, edu_coins: 0, total_focus_minutes: 0,
  total_lessons_completed: 0, total_quizzes_passed: 0,
  longest_streak: 0, current_streak: 0, last_activity_date: null,
};

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const { data } = await (supabase as any)
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setStats({
          xp: data.xp ?? data.total_xp ?? 0,
          level: data.level ?? Math.max(1, Math.floor((data.xp ?? data.total_xp ?? 0) / 100)),
          edu_coins: data.edu_coins ?? 0,
          total_focus_minutes: data.total_focus_minutes ?? 0,
          total_lessons_completed: data.total_lessons_completed ?? 0,
          total_quizzes_passed: data.total_quizzes_passed ?? 0,
          longest_streak: data.longest_streak ?? 0,
          current_streak: data.current_streak ?? 0,
          last_activity_date: data.last_activity_date ?? null,
        });
      } else {
        await (supabase as any).from('user_stats').insert({ user_id: user.id });
      }
      setLoading(false);
    };
    load();

    // Realtime
    const channel = supabase
      .channel('user-stats-' + user.id)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_stats',
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        if (payload.new) {
          setStats({
            xp: payload.new.xp ?? 0,
            level: payload.new.level ?? 1,
            edu_coins: payload.new.edu_coins ?? 0,
            total_focus_minutes: payload.new.total_focus_minutes ?? 0,
            total_lessons_completed: payload.new.total_lessons_completed ?? 0,
            total_quizzes_passed: payload.new.total_quizzes_passed ?? 0,
            longest_streak: payload.new.longest_streak ?? 0,
            current_streak: payload.new.current_streak ?? 0,
            last_activity_date: payload.new.last_activity_date ?? null,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const recalculateStreak = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data: streak } = await supabase.rpc('calculate_user_streak', { p_user_id: user.id });
    const newStreak = streak ?? 0;
    await (supabase as any).from('user_stats')
      .update({ current_streak: newStreak, longest_streak: Math.max(newStreak, stats.longest_streak), updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    setStats(prev => ({ ...prev, current_streak: newStreak, longest_streak: Math.max(newStreak, prev.longest_streak) }));
  }, [user, stats.longest_streak]);

  const addXP = useCallback(async (amount: number) => {
    if (!user) { setLoading(false); return; }
    await supabase.rpc('award_xp' as any, { p_user_id: user.id, p_xp: amount, p_coins: 0 });
  }, [user]);

  const xpToNextLevel = stats.level * 100;
  const xpProgress = (stats.xp % 100);

  return { stats, loading, recalculateStreak, addXP, xpToNextLevel, xpProgress };
};
