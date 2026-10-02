import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, FileText, Target, Megaphone, TrendingUp, TrendingDown, Inbox } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { JoinSchoolCard } from '@/components/School/JoinSchoolCard';

interface Pulse { thisWeek: number | null; lastWeek: number | null; weakest: { code: string; title: string | null; rate: number } | null }

/** Teacher "Today": action queue, pulse card, quick actions. */
export const TeacherTodayPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ungraded, setUngraded] = useState(0);
  const [plansWeek, setPlansWeek] = useState(0);
  const [pulse, setPulse] = useState<Pulse>({ thisWeek: null, lastWeek: null, weakest: null });

  useEffect(() => {
    if (!user) return;
    const db = supabase as any;
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const twoWeeks = new Date(Date.now() - 14 * 864e5).toISOString();
    (async () => {
      const [{ data: courses }, { count: plans }, { data: marks }] = await Promise.all([
        db.from('courses').select('id').eq('created_by', user.id),
        db.from('lesson_plans').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id).gte('created_at', weekAgo),
        db.from('mastery_entries').select('competence_code, competence_title, mastered, created_at').eq('teacher_id', user.id).gte('created_at', twoWeeks).limit(2000),
      ]);
      setPlansWeek(plans ?? 0);
      const ids = (courses ?? []).map((c: { id: string }) => c.id);
      if (ids.length) {
        const { data: asg } = await db.from('assignments').select('id').in('course_id', ids);
        const aIds = (asg ?? []).map((a: { id: string }) => a.id);
        if (aIds.length) {
          const { count } = await db.from('submissions').select('id', { count: 'exact', head: true }).in('assignment_id', aIds).is('graded_at', null);
          setUngraded(count ?? 0);
        }
      }
      const rows = (marks ?? []) as { competence_code: string; competence_title: string | null; mastered: boolean; created_at: string }[];
      const rate = (rs: typeof rows) => (rs.length ? Math.round((100 * rs.filter((r) => r.mastered).length) / rs.length) : null);
      const recent = rows.filter((r) => r.created_at >= weekAgo);
      const byComp = new Map<string, typeof rows>();
      recent.forEach((r) => byComp.set(r.competence_code, [...(byComp.get(r.competence_code) ?? []), r]));
      let weakest: Pulse['weakest'] = null;
      byComp.forEach((rs, code) => { const v = rate(rs)!; if (!weakest || v < weakest.rate) weakest = { code, title: rs[0].competence_title, rate: v }; });
      setPulse({ thisWeek: rate(recent), lastWeek: rate(rows.filter((r) => r.created_at < weekAgo)), weakest });
    })().catch(() => undefined);
  }, [user]);

  const queue = [
    { label: 'Enter mastery for today’s lesson', to: '/teach/mastery', icon: Target, show: true },
    { label: `${ungraded} submission${ungraded === 1 ? '' : 's'} to verify`, to: '/teach?tab=grading-queue', icon: Inbox, show: ungraded > 0 },
  ].filter((q) => q.show);

  const trendUp = pulse.thisWeek !== null && pulse.lastWeek !== null && pulse.thisWeek >= pulse.lastWeek;

  return (
    <div className="space-y-3">
      <JoinSchoolCard />
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/50 p-4 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">Action queue</h3>
          <div className="space-y-1.5">
            {queue.map((q) => (
              <button key={q.label} onClick={() => navigate(q.to)} className="flex w-full items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-left text-sm hover:bg-muted">
                <q.icon className="h-4 w-4 text-primary" />{q.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate('/teach?tab=lesson-plans')}><FileText className="mr-1 h-4 w-4" />New plan</Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate('/teach?tab=test-generator')}><ClipboardCheck className="mr-1 h-4 w-4" />New quiz</Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate('/teach?tab=announcements')}><Megaphone className="mr-1 h-4 w-4" />Announce</Button>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/50 p-4">
          <h3 className="text-sm font-semibold">Pulse</h3>
          {pulse.thisWeek === null ? (
            <p className="mt-2 text-xs text-muted-foreground">Enter mastery after a lesson to see how your classes are doing. {plansWeek} plan{plansWeek === 1 ? '' : 's'} this week.</p>
          ) : (
            <>
              <div className="mt-1 flex items-center gap-2 text-2xl font-bold">
                {pulse.thisWeek}%
                {pulse.lastWeek !== null && (trendUp ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />)}
              </div>
              <div className="text-xs text-muted-foreground">class mastery this week</div>
              {pulse.weakest && <p className="mt-2 text-xs">Needs attention tomorrow: <span className="font-semibold">{pulse.weakest.code}</span> {pulse.weakest.title} ({pulse.weakest.rate}%)</p>}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TeacherTodayPanel;
