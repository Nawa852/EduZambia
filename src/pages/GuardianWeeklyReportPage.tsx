import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLinkedChildren } from '@/hooks/useLinkedChildren';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Timer, Brain, BookOpen, Flame, TrendingUp, Users, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface WeekStats {
  focusMinutes: number;
  quizzes: number;
  avgScore: number;
  lessons: number;
  activeDays: number;
  perDay: number[];
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const useWeek = (studentId?: string) =>
  useQuery({
    queryKey: ['guardian-week', studentId],
    enabled: !!studentId,
    staleTime: 60_000,
    queryFn: async (): Promise<WeekStats> => {
      const from = new Date(Date.now() - 6 * 864e5);
      from.setHours(0, 0, 0, 0);
      const iso = from.toISOString();

      const [focus, quizzes, lessons] = await Promise.all([
        supabase.from('focus_sessions').select('focus_minutes, started_at').eq('user_id', studentId!).gte('started_at', iso),
        supabase.from('quiz_attempts').select('correct_answers, total_questions, created_at').eq('user_id', studentId!).gte('created_at', iso),
        supabase.from('lesson_completions').select('completed_at').eq('user_id', studentId!).gte('completed_at', iso),
      ]);

      const perDay = [0, 0, 0, 0, 0, 0, 0];
      const days = new Set<string>();
      const bucket = (ts: string) => {
        const idx = 6 - Math.min(6, Math.floor((Date.now() - new Date(ts).getTime()) / 864e5));
        return idx < 0 ? 0 : idx;
      };

      (focus.data ?? []).forEach((f) => {
        perDay[bucket(f.started_at)] += f.focus_minutes || 0;
        days.add(new Date(f.started_at).toDateString());
      });
      (quizzes.data ?? []).forEach((q) => days.add(new Date(q.created_at).toDateString()));
      (lessons.data ?? []).forEach((l) => days.add(new Date(l.completed_at).toDateString()));

      const scored = (quizzes.data ?? []).filter((q) => (q.total_questions ?? 0) > 0);
      const avg = scored.length
        ? Math.round(scored.reduce((a, q) => a + (q.correct_answers / q.total_questions) * 100, 0) / scored.length)
        : 0;

      return {
        focusMinutes: perDay.reduce((a, b) => a + b, 0),
        quizzes: quizzes.data?.length ?? 0,
        avgScore: avg,
        lessons: lessons.data?.length ?? 0,
        activeDays: days.size,
        perDay,
      };
    },
  });

const Metric: React.FC<{ icon: typeof Timer; label: string; value: string; tone: string }> = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-2xl border border-border/60 p-4">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tone}`}><Icon className="w-4 h-4" /></div>
    <p className="text-2xl font-semibold tabular-nums leading-none">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

/** Plain-language weekly report a parent can read in 20 seconds — and share. */
const GuardianWeeklyReportPage: React.FC = () => {
  const { data: children = [], isLoading } = useLinkedChildren();
  const [idx, setIdx] = useState(0);
  const child = children[idx];
  const { data: week, isLoading: weekLoading } = useWeek(child?.studentId);

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  if (children.length === 0) {
    return (
      <Card className="rounded-2xl border-border/60 max-w-lg mx-auto">
        <CardContent className="p-10 text-center space-y-3">
          <Users className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="font-medium">No child linked yet</p>
          <p className="text-sm text-muted-foreground">
            Ask your child to open Synapse → Me → Family Link and share their 6-character code.
          </p>
          <Button asChild className="rounded-xl"><Link to="/guardian-link">Enter a code</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const summary = week
    ? `${child.name} studied ${Math.round(week.focusMinutes / 60 * 10) / 10}h across ${week.activeDays} day(s) this week, finished ${week.lessons} lesson(s) and took ${week.quizzes} quiz(zes)${week.quizzes ? ` averaging ${week.avgScore}%` : ''}.`
    : '';

  const share = async () => {
    const text = `Synapse weekly report — ${summary}`;
    if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* dismissed */ } }
    await navigator.clipboard.writeText(text);
    toast.success('Report copied');
  };

  const max = Math.max(...(week?.perDay ?? [1]), 1);

  return (
    <div className="space-y-4">
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {children.map((c, i) => (
            <Button key={c.linkId} size="sm" variant={i === idx ? 'default' : 'outline'}
              className="rounded-full shrink-0" onClick={() => setIdx(i)}>
              {c.name}
            </Button>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Last 7 days</p>
            <h2 className="text-2xl font-semibold tracking-tight">{child.name}</h2>
            <div className="flex gap-2 mt-2">
              {child.grade && <Badge variant="secondary" className="rounded-full">{child.grade}</Badge>}
              {child.school && <Badge variant="outline" className="rounded-full">{child.school}</Badge>}
            </div>
          </div>
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={share}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
        {summary && <p className="text-sm text-muted-foreground mt-3">{summary}</p>}
      </div>

      {weekLoading || !week ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric icon={Timer} label="Focus time" value={`${Math.floor(week.focusMinutes / 60)}h ${week.focusMinutes % 60}m`} tone="bg-emerald-500/10 text-emerald-600" />
            <Metric icon={Brain} label="Quizzes taken" value={String(week.quizzes)} tone="bg-sky-500/10 text-sky-600" />
            <Metric icon={TrendingUp} label="Average score" value={week.quizzes ? `${week.avgScore}%` : '—'} tone="bg-violet-500/10 text-violet-600" />
            <Metric icon={BookOpen} label="Lessons done" value={String(week.lessons)} tone="bg-amber-500/10 text-amber-600" />
          </div>

          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-semibold">Study minutes per day</p>
                <span className="ml-auto text-xs text-muted-foreground">{week.activeDays}/7 active days</span>
              </div>
              <div className="flex items-end gap-2 h-28">
                {week.perDay.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground tabular-nums">{m || ''}</span>
                    <div className="w-full rounded-t-lg bg-primary/80 min-h-[3px]" style={{ height: `${(m / max) * 80}px` }} />
                    <span className="text-[10px] text-muted-foreground">
                      {DAYS[new Date(Date.now() - (6 - i) * 864e5).getDay()]}
                    </span>
                  </div>
                ))}
              </div>
              {week.focusMinutes === 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  No study sessions recorded this week. A short 25-minute focus session is a good place to restart.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default GuardianWeeklyReportPage;
