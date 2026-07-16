import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingUp, Target, Clock, Award, Flame } from 'lucide-react';

interface DayPoint { day: string; minutes: number; score: number; }

const StudentAnalyticsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ xp: 0, level: 1, coins: 0, focus_minutes: 0, lessons: 0, quizzes: 0, streak: 0 });
  const [weekly, setWeekly] = useState<DayPoint[]>([]);
  const [subjects, setSubjects] = useState<{ subject: string; avg: number }[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [stat, streakRes, focus, quiz, goalsRes] = await Promise.all([
        supabase.from('user_stats').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.rpc('calculate_user_streak', { p_user_id: user.id }),
        supabase.from('focus_sessions').select('started_at, focus_minutes').eq('user_id', user.id).gte('started_at', since),
        supabase.from('quiz_attempts').select('created_at, correct_answers, total_questions, subject').eq('user_id', user.id).gte('created_at', since),
        supabase.from('study_goals').select('*').eq('user_id', user.id).order('due_date', { ascending: true }).limit(6),
      ]);

      const s = stat.data as any;
      setStats({
        xp: s?.xp || 0, level: s?.level || 1, coins: s?.edu_coins || 0,
        focus_minutes: s?.total_focus_minutes || 0, lessons: s?.total_lessons_completed || 0,
        quizzes: s?.total_quizzes_passed || 0, streak: (streakRes.data as any) || 0,
      });

      // Build 7-day series
      const map: Record<string, DayPoint> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        map[key] = { day: d.toLocaleDateString('en', { weekday: 'short' }), minutes: 0, score: 0 };
      }
      (focus.data || []).forEach(f => {
        const k = (f.started_at || '').slice(0, 10);
        if (map[k]) map[k].minutes += f.focus_minutes || 0;
      });
      const scoreBuckets: Record<string, number[]> = {};
      (quiz.data || []).forEach(q => {
        const k = (q.created_at || '').slice(0, 10);
        if (map[k] && q.total_questions) {
          const pct = Math.round((q.correct_answers / q.total_questions) * 100);
          scoreBuckets[k] = [...(scoreBuckets[k] || []), pct];
        }
      });
      Object.entries(scoreBuckets).forEach(([k, arr]) => {
        if (map[k]) map[k].score = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      });
      setWeekly(Object.values(map));

      // Skill growth by subject
      const bySub: Record<string, number[]> = {};
      (quiz.data || []).forEach(q => {
        if (q.subject && q.total_questions) {
          bySub[q.subject] = [...(bySub[q.subject] || []), Math.round((q.correct_answers / q.total_questions) * 100)];
        }
      });
      setSubjects(Object.entries(bySub).map(([subject, arr]) => ({ subject, avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) })));
      setGoals(goalsRes.data || []);
      setLoading(false);
    })();
  }, [user]);

  const kpis = [
    { label: 'Study Streak', value: `${stats.streak} days`, icon: Flame, color: 'text-orange-500' },
    { label: 'Focus Minutes', value: stats.focus_minutes, icon: Clock, color: 'text-blue-500' },
    { label: 'Lessons Done', value: stats.lessons, icon: Target, color: 'text-green-500' },
    { label: 'Quizzes Passed', value: stats.quizzes, icon: Award, color: 'text-purple-500' },
  ];

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><TrendingUp className="h-7 w-7 text-primary" /> Progress Analytics</h1>
        <p className="text-muted-foreground">Insights from your real study activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className="text-2xl font-bold mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Weekly Focus Minutes</CardTitle><CardDescription>Last 7 days</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quiz Score Trend</CardTitle><CardDescription>Average % per day</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Skill Growth by Subject</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {subjects.length === 0 ? <p className="text-sm text-muted-foreground">Take a few quizzes to see subject-level growth.</p> :
              subjects.map(s => (
                <div key={s.subject} className="space-y-1">
                  <div className="flex justify-between text-sm"><span>{s.subject}</span><span className="text-muted-foreground">{s.avg}%</span></div>
                  <Progress value={s.avg} className="h-2" />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming Goals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {goals.length === 0 ? <p className="text-sm text-muted-foreground">No goals yet.</p> :
              goals.map(g => {
                const pct = g.target ? Math.min(100, ((g.current || 0) / g.target) * 100) : 0;
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate pr-2">{g.title}</span>
                      <span className="text-muted-foreground text-xs">{g.due_date ? new Date(g.due_date).toLocaleDateString() : ''}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAnalyticsPage;
