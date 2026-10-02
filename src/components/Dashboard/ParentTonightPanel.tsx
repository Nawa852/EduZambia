import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { MessageCircleHeart, Timer, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

interface Child { id: string; name: string; minutesToday: number; minutesWeek: number; sessions: number; recentTopic: string | null; lastMastered: string | null }

/** Parent Home: every child on one screen, verified study minutes, tonight's conversation starter. */
export const ParentTonightPanel: React.FC = () => {
  const { user } = useAuth();
  const [kids, setKids] = useState<Child[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const db = supabase as any;
    (async () => {
      const { data: links } = await db.from('guardian_links').select('student_id').eq('guardian_id', user.id).eq('status', 'accepted');
      const ids: string[] = (links ?? []).map((l: { student_id: string }) => l.student_id);
      if (!ids.length) { setKids([]); return; }
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const week = new Date(Date.now() - 7 * 864e5).toISOString();
      const [{ data: profiles }, { data: focus }, { data: quiz }, { data: mastery }] = await Promise.all([
        db.from('profiles').select('id, full_name').in('id', ids),
        db.from('focus_sessions').select('user_id, focus_minutes, started_at, gave_up').in('user_id', ids).gte('started_at', week),
        db.from('quiz_attempts').select('user_id, topic, subject, created_at').in('user_id', ids).order('created_at', { ascending: false }).limit(50),
        db.from('mastery_entries').select('student_id, competence_title, mastered, created_at').in('student_id', ids).eq('mastered', true).order('created_at', { ascending: false }).limit(50),
      ]);
      setKids(ids.map((id) => {
        const f = (focus ?? []).filter((x: any) => x.user_id === id && !x.gave_up);
        const q = (quiz ?? []).find((x: any) => x.user_id === id);
        const m = (mastery ?? []).find((x: any) => x.student_id === id);
        return {
          id,
          name: ((profiles ?? []).find((p: any) => p.id === id)?.full_name || 'Your child').split(' ')[0],
          minutesToday: f.filter((x: any) => new Date(x.started_at) >= today).reduce((s: number, x: any) => s + (x.focus_minutes ?? 0), 0),
          minutesWeek: f.reduce((s: number, x: any) => s + (x.focus_minutes ?? 0), 0),
          sessions: f.length,
          recentTopic: q?.topic || q?.subject || null,
          lastMastered: m?.competence_title ?? null,
        };
      }));
    })().catch(() => setKids([]));
  }, [user]);

  if (!kids?.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {kids.map((k) => (
        <Card key={k.id} className="space-y-3 rounded-2xl border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">{k.name}</div>
            <span className="flex items-center gap-1 text-xs text-success"><ShieldCheck className="h-3.5 w-3.5" />Verified by focus timer</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Timer className="h-4 w-4 text-primary" />
            <span><span className="font-bold">{k.minutesToday} min</span> today · {k.minutesWeek} min across {k.sessions} sessions this week</span>
          </div>
          <div className="rounded-xl bg-primary/5 p-3 text-sm">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary"><MessageCircleHeart className="h-4 w-4" />Tonight, ask {k.name}</div>
            {k.lastMastered
              ? <>“I heard you mastered <span className="font-medium">{k.lastMastered.toLowerCase()}</span> — can you explain it to me?”</>
              : k.recentTopic
                ? <>“You practised <span className="font-medium">{k.recentTopic}</span> — what was the hardest question?”</>
                : <>“What did you learn today that surprised you?”</>}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ParentTonightPanel;
