import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Flame, Target, CheckCircle2, Clock, ArrowRight, ChevronRight,
  Camera, Calculator, Atom, Sparkles, Grid3x3, BookOpen,
  Beaker, Brain, FlaskConical, Plus, Leaf, Calendar,
  FileText, Layers, Share2, BookText, MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useUserStats } from '@/hooks/useUserStats';
import { supabase } from '@/integrations/supabase/client';

interface Props { userName: string; }

const subjectMeta: Record<string, { icon: any; tint: string }> = {
  Physics: { icon: Atom, tint: 'from-blue-500/15 to-blue-500/5 text-blue-600' },
  Biology: { icon: Leaf, tint: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600' },
  Mathematics: { icon: Calculator, tint: 'from-amber-500/15 to-amber-500/5 text-amber-600' },
  Chemistry: { icon: FlaskConical, tint: 'from-purple-500/15 to-purple-500/5 text-purple-600' },
};

export function StudentDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const stats = useUserStats();
  const [subjects, setSubjects] = useState<Array<{ name: string; progress: number; notes: number }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; due: string; done: boolean }>>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('progress, courses(subject)')
        .eq('user_id', user.id);
      const bySubject = new Map<string, { total: number; count: number }>();
      (data || []).forEach((e: any) => {
        const s = e.courses?.subject || 'General';
        const prev = bySubject.get(s) || { total: 0, count: 0 };
        bySubject.set(s, { total: prev.total + (e.progress || 0), count: prev.count + 1 });
      });
      const list = Array.from(bySubject.entries()).slice(0, 4).map(([name, v]) => ({
        name, progress: Math.round(v.total / Math.max(v.count, 1)), notes: v.count,
      }));
      setSubjects(list.length ? list : [
        { name: 'Physics', progress: 80, notes: 12 },
        { name: 'Biology', progress: 60, notes: 8 },
        { name: 'Mathematics', progress: 70, notes: 15 },
        { name: 'Chemistry', progress: 75, notes: 10 },
      ]);
    })();

  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const firstName = userName.split(' ')[0];
  const streak = stats?.stats?.current_streak || 7;
  const focusMin = (stats?.stats?.total_focus_minutes || 165) % 600;
  const focusHrs = Math.floor(focusMin / 60);
  const focusRem = focusMin % 60;
  const tasksDone = 5;
  const tasksGoal = 8;

  const quickTools = [
    { icon: Camera, label: 'Quick Capture', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10', to: '/scan' },
    { icon: Atom, label: 'Periodic Table', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', to: '/tools/periodic-table' },
    { icon: Calculator, label: 'Calculator', color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10', to: '/tools/calculator' },
    { icon: Sparkles, label: 'AI Assistant', color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10', to: '/ai-chat' },
    { icon: Grid3x3, label: 'More Tools', color: 'bg-muted text-foreground/70', to: '/' },
  ];

  return (
    <div className="space-y-4 lg:space-y-5 pb-20 lg:pb-6">
      {/* Greeting + streak */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight text-foreground">
            {greeting()}, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Let's make today count.</p>
        </div>
        <Card className="px-3 py-2 flex items-center gap-2 rounded-2xl border-border/40 shadow-sm shrink-0">
          <Flame className="w-5 h-5 text-orange-500" />
          <div>
            <div className="text-base font-bold leading-none">{streak}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">day streak</div>
          </div>
        </Card>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 rounded-2xl border-border/40 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Focus Time</span>
          </div>
          <div className="text-xl font-extrabold">{focusHrs}h {focusRem}m</div>
          <div className="text-[11px] text-muted-foreground">today</div>
          <svg className="mt-1 w-full h-5" viewBox="0 0 100 24" preserveAspectRatio="none">
            <polyline fill="none" stroke="currentColor" strokeWidth="1.6" className="text-emerald-500"
              points="0,18 12,16 24,17 36,12 48,14 60,8 72,11 84,6 100,9" />
          </svg>
        </Card>

        <Card className="p-3 rounded-2xl border-border/40 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Study Goal</span>
          </div>
          <div className="text-xl font-extrabold">3/5</div>
          <Progress value={60} className="h-1 mt-1.5" />
        </Card>
        <Card className="p-3 rounded-2xl border-border/40 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Tasks Done</span>
          </div>
          <div className="text-xl font-extrabold">{tasksDone}/{tasksGoal}</div>
          <Progress value={(tasksDone / tasksGoal) * 100} className="h-1 mt-1.5" />
        </Card>
      </div>

      {/* Study Plan */}
      <Card className="p-4 rounded-2xl border-border/40 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-semibold">Study Plan</span>
          </div>
          <button onClick={() => navigate('/study-planner')} className="text-xs text-primary font-medium">View all</button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold">Next: Physics Lesson 3</div>
            <div className="text-xs text-muted-foreground">Mechanics — Motion in 2D</div>
            <Progress value={45} className="h-1.5 mt-2" />
            <div className="text-[11px] text-muted-foreground mt-1.5">In 45 min</div>
          </div>
          <Button onClick={() => navigate('/study-planner')} className="rounded-full px-4 h-9 text-xs font-semibold shrink-0">
            Start Session
          </Button>
        </div>
      </Card>

      {/* Quick Tools horizontal grid */}
      <div className="grid grid-cols-5 gap-2">
        {quickTools.map((t) => (
          <button key={t.label} onClick={() => navigate(t.to)} className="flex flex-col items-center gap-1.5 group">
            <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl ${t.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
              <t.icon className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <span className="text-[10px] lg:text-[11px] font-medium text-center leading-tight">{t.label}</span>
          </button>
        ))}
      </div>

      {/* My Subjects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">My Subjects</h2>
          <button onClick={() => navigate('/subjects')} className="text-xs text-primary font-medium">View all</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {subjects.map((s) => {
            const meta = subjectMeta[s.name] || { icon: BookText, tint: 'from-slate-500/15 to-slate-500/5 text-slate-600' };
            const Icon = meta.icon;
            return (
              <Card key={s.name} onClick={() => navigate(`/subjects?subject=${encodeURIComponent(s.name)}`)} className="p-3 rounded-2xl border-border/40 shadow-sm cursor-pointer hover:shadow-md transition-all">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.tint} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="text-[11px] text-muted-foreground mb-2">{s.notes} notes</div>
                <Progress value={s.progress} className="h-1" />
                <div className="text-[10px] text-muted-foreground mt-1">{s.progress}%</div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tasks & Focus Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4 rounded-2xl border-border/40 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm">Tasks & Planner</span>
            </div>
            <button onClick={() => navigate('/study-planner')} className="text-muted-foreground hover:text-primary">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2.5">
            {(tasks.length ? tasks : [
              { id: '1', title: 'Revise Mechanics', due: 'Today', done: true },
              { id: '2', title: 'Complete Past Paper', due: 'Today', done: true },
              { id: '3', title: 'Read Chapter 5', due: 'Tomorrow', done: false },
              { id: '4', title: 'Do Quiz on Cell', due: 'Tomorrow', done: false },
            ]).map((t) => (
              <div key={t.id} className="flex items-center gap-2.5">
                <Checkbox checked={t.done} className="rounded" />
                <span className={`flex-1 text-sm ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.title}</span>
                <span className="text-[11px] text-muted-foreground">{t.due}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/study-planner')} className="text-xs text-primary font-medium mt-3 block">View all tasks</button>
        </Card>

        <Card className="p-4 rounded-2xl border-border/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-sm">Focus Timer</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-center py-2">
            <div className="text-4xl font-extrabold">25:00</div>
            <div className="text-[11px] text-muted-foreground mt-1.5 mb-3">Stay focused and avoid distractions.</div>
            <Button onClick={() => navigate('/focus-mode')} className="rounded-full px-6 h-9 text-xs font-semibold">
              Start Focus
            </Button>
          </div>
          <div className="absolute -bottom-3 -right-2 text-5xl opacity-90 select-none">🌱</div>
        </Card>
      </div>

      {/* Quick Tools row */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base">Quick Tools</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
          {[
            { icon: Layers, label: 'Flashcards', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', to: '/flashcards' },
            { icon: FileText, label: 'Quiz', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', to: '/ai-quiz' },
            { icon: Share2, label: 'Mind Map', color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', to: '/mind-maps' },
            { icon: BookText, label: 'PDF Reader', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400', to: '/pdf-reader' },
            { icon: MoreHorizontal, label: 'More', color: 'bg-muted text-foreground/70', to: '/study' },
          ].map((t) => (
            <button key={t.label} onClick={() => navigate(t.to)} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${t.color} text-xs font-semibold whitespace-nowrap shrink-0`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
