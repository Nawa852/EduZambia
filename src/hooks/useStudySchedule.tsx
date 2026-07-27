import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface StudySchedule {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  days: string[];
  isActive: boolean;
}

export function useStudySchedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('study_schedules' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (!error && data) {
        setSchedules((data as any[]).map(s => ({
          id: s.id,
          subject: s.subject,
          startTime: s.start_time,
          endTime: s.end_time,
          days: s.days || [],
          isActive: s.is_active,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = useCallback(async (schedule: Omit<StudySchedule, 'id' | 'isActive'>) => {
    if (!user) { setLoading(false); return; }
    try {
      const { error } = await supabase.from('study_schedules' as any).insert({
        user_id: user.id,
        subject: schedule.subject,
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        days: schedule.days,
        is_active: true,
      } as any);

      if (!error) await fetchSchedules();
    } catch (err) {
      console.error('Failed to add schedule:', err);
    }
  }, [user, fetchSchedules]);

  const removeSchedule = useCallback(async (id: string) => {
    if (!user) { setLoading(false); return; }
    try {
      await supabase.from('study_schedules' as any).delete().eq('id', id);
      await fetchSchedules();
    } catch (err) {
      console.error('Failed to remove schedule:', err);
    }
  }, [user, fetchSchedules]);

  const getActiveNow = useCallback(() => {
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    return schedules.find(s =>
      s.isActive && s.days.includes(dayName) && s.startTime <= currentTime && s.endTime > currentTime
    );
  }, [schedules]);

  return { schedules, loading, addSchedule, removeSchedule, getActiveNow, refetch: fetchSchedules };
}
