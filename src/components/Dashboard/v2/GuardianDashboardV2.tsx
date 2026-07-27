import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuardianData } from '@/hooks/useGuardianData';
import {
  Users, BookOpen, TrendingUp, Bell, Calendar, Clock,
  MessageCircle, Trophy, ArrowRight, Plus, Sparkles, Shield,
} from 'lucide-react';

interface Props { userName: string; }

const tools = [
  { icon: MessageCircle, label: 'Message teacher', tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10', to: '/connect?tab=messenger' },
  { icon: Calendar, label: 'Calendar', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', to: '/calendar' },
  { icon: TrendingUp, label: 'Progress', tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10', to: '/family?tab=grades' },
  { icon: Shield, label: 'Controls', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10', to: '/family?tab=controls' },
  { icon: BookOpen, label: 'Homework', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10', to: '/family?tab=homework' },
  { icon: Bell, label: 'Activity', tint: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10', to: '/family?tab=activity' },
];

export function GuardianDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const { students, weeklySummary, loading } = useGuardianData();

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  const avgScore = (() => {
    const scores = students.flatMap(s => s.subjects.map(g => g.score)).filter((n): n is number => n != null);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  })();

  const stats = [
    { icon: Users, label: 'Children', value: String(students.length), sub: 'Linked accounts', tint: 'bg-blue-500/10 text-blue-600' },
    { icon: TrendingUp, label: 'Avg grade', value: avgScore != null ? `${avgScore}%` : '—', sub: 'Recorded results', tint: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Clock, label: 'Focus time', value: `${weeklySummary.focusMinutes}m`, sub: 'Last 7 days', tint: 'bg-rose-500/10 text-rose-600' },
    { icon: Trophy, label: 'Quizzes', value: String(weeklySummary.quizzesTaken), sub: 'Last 7 days', tint: 'bg-amber-500/10 text-amber-600' },
  ];

  const activity = students.flatMap(s => s.recentActivity.map(a => ({ ...a, child: s.name }))).slice(0, 6);

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge className="mb-2 uppercase tracking-wider text-[10px] bg-pink-500/10 text-pink-700 border-0">Guardian</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Real activity from your linked children.</p>
        </div>
        <Button onClick={() => navigate('/family?tab=children')} variant="outline" className="rounded-full text-xs h-9">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Link a child
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[104px] rounded-2xl" />)
          : stats.map(s => (
            <Card key={s.label} className="p-4 rounded-2xl border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-xl ${s.tint} flex items-center justify-center`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
              </div>
              <div className="text-2xl font-extrabold mt-1">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.sub}</div>
            </Card>
          ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">My children</h2>
          <button onClick={() => navigate('/family?tab=children')} className="text-xs text-primary font-medium">Manage</button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Skeleton className="h-36 rounded-2xl" /><Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : students.length === 0 ? (
          <Card className="p-8 rounded-2xl border-border/40 text-center space-y-2">
            <Users className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <div className="font-semibold">No children linked yet</div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Ask your child to generate a 6-character link code in their profile, then redeem it here.
            </p>
            <Button className="rounded-full" onClick={() => navigate('/family?tab=children')}>Link a child</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {students.map(c => {
              const scores = c.subjects.map(s => s.score).filter((n): n is number => n != null);
              const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
              const progress = c.enrollments.length
                ? Math.round(c.enrollments.reduce((a, e) => a + (e.progress || 0), 0) / c.enrollments.length)
                : 0;
              return (
                <Card key={c.id} onClick={() => navigate(`/family?tab=children&child=${c.id}`)} className="p-4 rounded-2xl border-border/40 cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                        {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.grade || 'Grade not set'}{c.school ? ` · ${c.school}` : ''}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{c.lessonCompletionsCount} lessons</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Avg grade</div>
                      <div className="text-lg font-extrabold">{avg != null ? `${avg}%` : '—'}</div>
                      <Progress value={avg ?? 0} className="h-1 mt-1" />
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Course progress</div>
                      <div className="text-lg font-extrabold">{progress}%</div>
                      <Progress value={progress} className="h-1 mt-1" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="font-bold">Recent activity</h2>
            </div>
            <button onClick={() => navigate('/family?tab=activity')} className="text-xs text-primary font-medium">View all</button>
          </div>
          {loading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : activity.length === 0 ? (
            <div className="py-8 text-center space-y-1.5">
              <Bell className="w-7 h-7 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nothing yet this week.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {a.type === 'quiz' ? <Trophy className="w-4 h-4" /> : a.type === 'grade' ? <TrendingUp className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground">{a.child}{a.score ? ` · ${a.score}` : ''}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">{new Date(a.time).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <h2 className="font-bold mb-3">Guardian tools</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {tools.map(t => (
              <button key={t.label} onClick={() => navigate(t.to)} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className={`w-11 h-11 rounded-2xl ${t.tint} flex items-center justify-center`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {students.length > 0 && (
        <Card className="p-5 rounded-2xl border-border/40 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-card shadow flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-bold">Weekly family report</div>
                <div className="text-xs text-muted-foreground">
                  {weeklySummary.lessonsCompleted} lessons · {weeklySummary.quizzesTaken} quizzes · {weeklySummary.focusMinutes} focus minutes
                </div>
              </div>
            </div>
            <Button onClick={() => navigate('/family?tab=activity')} className="rounded-full">View report <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Button>
          </div>
        </Card>
      )}
    </div>
  );
}
