import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Target, Users, CalendarClock } from 'lucide-react';

interface ReviewRow {
  id: string;
  user_id: string;
  deck_id: string;
  quality: number;
  seconds_spent: number;
  created_at: string;
}

const DAYS = 14;

/**
 * Spaced-repetition analytics. Students see their own recall curve;
 * teachers/admins additionally see aggregated class retention (RLS scopes
 * the rows they are allowed to read).
 */
const SpacedRepetitionAnalytics: React.FC<{ deckId?: string }> = ({ deckId }) => {
  const { profile } = useProfile();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const role = profile?.role ?? 'student';
  const isEducator = role === 'teacher' || role === 'institution' || role === 'ministry';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - DAYS * 864e5).toISOString();
      let q = supabase
        .from('flashcard_reviews')
        .select('id, user_id, deck_id, quality, seconds_spent, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(1000);
      if (deckId) q = q.eq('deck_id', deckId);
      const { data } = await q;
      if (!cancelled) {
        setRows((data ?? []) as ReviewRow[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [deckId]);

  const stats = useMemo(() => {
    const total = rows.length;
    const correct = rows.filter(r => r.quality >= 3).length;
    const retention = total ? Math.round((correct / total) * 100) : 0;
    const minutes = Math.round(rows.reduce((n, r) => n + (r.seconds_spent || 0), 0) / 60);
    const learners = new Set(rows.map(r => r.user_id)).size;

    const byDay: number[] = Array(DAYS).fill(0);
    const correctByDay: number[] = Array(DAYS).fill(0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    rows.forEach(r => {
      const d = new Date(r.created_at); d.setHours(0, 0, 0, 0);
      const idx = DAYS - 1 - Math.round((today.getTime() - d.getTime()) / 864e5);
      if (idx >= 0 && idx < DAYS) {
        byDay[idx] += 1;
        if (r.quality >= 3) correctByDay[idx] += 1;
      }
    });
    const activeDays = byDay.filter(Boolean).length;
    return { total, retention, minutes, learners, byDay, correctByDay, activeDays };
  }, [rows]);

  if (loading) return <Skeleton className="h-40 w-full rounded-3xl" />;

  if (stats.total === 0) {
    return (
      <Card className="rounded-3xl border-dashed">
        <CardContent className="py-10 text-center space-y-2">
          <Brain className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No review data yet</p>
          <p className="text-xs text-muted-foreground">
            {isEducator
              ? 'Analytics appear once your students review their decks.'
              : 'Review a deck and your recall curve will build here.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const max = Math.max(...stats.byDay, 1);

  const tiles = [
    { label: 'Retention', value: `${stats.retention}%`, icon: Target, tone: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Reviews', value: String(stats.total), icon: TrendingUp, tone: 'text-primary bg-primary/10' },
    { label: 'Time', value: `${stats.minutes}m`, icon: CalendarClock, tone: 'text-amber-600 bg-amber-500/10' },
    ...(isEducator
      ? [{ label: 'Learners', value: String(stats.learners), icon: Users, tone: 'text-violet-600 bg-violet-500/10' }]
      : [{ label: 'Active days', value: `${stats.activeDays}/${DAYS}`, icon: Users, tone: 'text-violet-600 bg-violet-500/10' }]),
  ];

  return (
    <Card className="rounded-3xl border-border/50">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-foreground">Spaced repetition analytics</h3>
          </div>
          <Badge variant="secondary" className="rounded-full text-[10px] capitalize">{isEducator ? 'Class view' : 'My view'}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tiles.map(t => (
            <div key={t.label} className="rounded-2xl border border-border/40 p-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-2 ${t.tone}`}>
                <t.icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-lg font-bold leading-none text-foreground">{t.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{t.label}</div>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Last {DAYS} days</p>
          <div className="flex items-end gap-1 h-20">
            {stats.byDay.map((n, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-[2px]" title={`${n} reviews`}>
                <div className="rounded-t-sm bg-primary/25 min-h-[2px]" style={{ height: `${(n / max) * 100}%` }}>
                  <div
                    className="w-full rounded-t-sm bg-primary"
                    style={{ height: n ? `${(stats.correctByDay[i] / n) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Solid = recalled correctly · faded = missed</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpacedRepetitionAnalytics;
