import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Star, Trophy, Flame, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SpotlightStudent {
  id: string;
  name: string;
  avatar: string | null;
  xp: number;
  lessons: number;
  streak: number;
}

export const StudentSpotlight = () => {
  const [students, setStudents] = useState<SpotlightStudent[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.from('leaderboard_view' as any) as any)
        .select('user_id, xp, total_lessons_completed, current_streak')
        .order('xp', { ascending: false })
        .limit(5);

      if (!data?.length) return;

      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.id] = p; });

      setStudents(data.map(d => ({
        id: d.user_id,
        name: profileMap[d.user_id]?.full_name || 'Student',
        avatar: profileMap[d.user_id]?.avatar_url,
        xp: d.xp,
        lessons: d.total_lessons_completed,
        streak: d.current_streak,
      })));
    };
    load();
  }, []);

  if (students.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-foreground">Top Learners</h3>
      </div>
      <div className="divide-y divide-border/30">
        {students.map((s, i) => (
          <div key={s.id} className="px-4 py-2.5 flex items-center gap-3">
            <span className="text-sm w-6 text-center">{medals[i] || `${i + 1}.`}</span>
            <Avatar className="w-8 h-8">
              <AvatarImage src={s.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {s.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Trophy className="w-3 h-3" />{s.xp} XP</span>
                <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" />{s.lessons}</span>
                <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" />{s.streak}d</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
