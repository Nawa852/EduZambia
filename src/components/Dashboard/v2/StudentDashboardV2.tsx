import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Flame, Target, CheckCircle2, Clock, ChevronRight, ChevronDown,
  Camera, Calculator, Atom, Sparkles, Grid3x3, BookOpen,
  FlaskConical, Plus, Leaf, FileText, Layers, Share2, BookText,
  MoreHorizontal, FolderOpen, StickyNote, ListChecks, HelpCircle,
  Folder, Bot, ScanLine, FileType2, Link2, Repeat, BarChart3,
  Search, Mic, Image as ImageIcon, Video, Paperclip,
  CalendarDays, Radio,
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useUserStats } from '@/hooks/useUserStats';
import { supabase } from '@/integrations/supabase/client';
import UpcomingClassesCard from '@/components/Dashboard/UpcomingClassesCard';
import AIShortcutsCard from '@/components/Dashboard/AIShortcutsCard';

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

  const createChips = [
    { icon: StickyNote, label: 'New Note', tint: 'text-violet-600 bg-violet-500/10', to: '/student-notes?action=new' },
    { icon: Layers, label: 'New Flashcard', tint: 'text-blue-600 bg-blue-500/10', to: '/flashcards?action=new' },
    { icon: ListChecks, label: 'New Task', tint: 'text-emerald-600 bg-emerald-500/10', to: '/study-planner?action=new' },
    { icon: Folder, label: 'New Folder', tint: 'text-amber-600 bg-amber-500/10', to: '/student-notes?folder=new' },
    { icon: HelpCircle, label: 'New Quiz', tint: 'text-rose-600 bg-rose-500/10', to: '/ai-quiz?action=new' },
  ];

  const knowledgeHub = [
    { name: 'Physics', notes: 12, cards: 34, icon: Atom, tint: 'bg-blue-500/10 text-blue-600' },
    { name: 'Biology', notes: 8, cards: 21, icon: Leaf, tint: 'bg-emerald-500/10 text-emerald-600' },
    { name: 'Mathematics', notes: 15, cards: 40, icon: Calculator, tint: 'bg-amber-500/10 text-amber-600' },
    { name: 'Past Papers', notes: 5, cards: 12, icon: FileText, tint: 'bg-rose-500/10 text-rose-600' },
  ];

  const recentNotes = [
    { title: 'Cell Structure', subject: 'Biology', when: 'Today' },
    { title: 'Kinematics Summary', subject: 'Physics', when: 'Yesterday' },
    { title: 'Integration Techniques', subject: 'Mathematics', when: '2 days ago' },
  ];

  const flashDecks = [
    { title: 'Physics Formulas', cards: 24, pct: 80, color: 'text-blue-600 stroke-blue-500' },
    { title: 'Biology Terms', cards: 18, pct: 60, color: 'text-emerald-600 stroke-emerald-500' },
    { title: 'Math Concepts', cards: 30, pct: 40, color: 'text-amber-600 stroke-amber-500' },
  ];

  const smartTools = [
    { icon: Bot, label: 'AI Chat', desc: 'Streaming · markdown · LaTeX · voice · images.', tint: 'bg-purple-500/10 text-purple-600', to: '/ai?tab=chat' },
    { icon: Camera, label: 'Snap & Solve', desc: 'Photo of homework → instant step-by-step.', tint: 'bg-rose-500/10 text-rose-600', to: '/snap-solve' },
    { icon: ScanLine, label: 'Document Scanner', desc: 'Scan notes and extract text.', tint: 'bg-blue-500/10 text-blue-600', to: '/scan' },
    { icon: FileType2, label: 'PDF Reader', desc: 'Read, highlight, and annotate.', tint: 'bg-amber-500/10 text-amber-600', to: '/pdf-reader' },
    { icon: Link2, label: 'Web Clipper', desc: 'Save articles and resources.', tint: 'bg-cyan-500/10 text-cyan-600', to: '/student-notes?source=web' },
    { icon: Layers, label: 'Flashcards', desc: 'Create and review active recall cards.', tint: 'bg-emerald-500/10 text-emerald-600', to: '/flashcards' },
    { icon: HelpCircle, label: 'Quiz Generator', desc: 'Generate quizzes from your notes.', tint: 'bg-amber-500/10 text-amber-600', to: '/ai-quiz' },
    { icon: Share2, label: 'Mind Maps', desc: 'Visualize and connect ideas.', tint: 'bg-teal-500/10 text-teal-600', to: '/mind-maps' },
    { icon: Repeat, label: 'Spaced Repetition', desc: 'Smart review, better retention.', tint: 'bg-indigo-500/10 text-indigo-600', to: '/flashcards?mode=spaced' },
  ];

  return (
    <div className="space-y-5 lg:space-y-6 pb-24 lg:pb-8 max-w-[1280px] mx-auto">
      {/* Greeting + Study Plan (desktop side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:gap-5 items-start">
        <div>
          <div className="flex items-start justify-between gap-3 mb-4 lg:mb-5">
            <div>
              <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight text-foreground">
                {greeting()}, {firstName}! <span className="inline-block animate-fade-in">👋</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Let's make today count.</p>
            </div>
            {/* Mobile streak badge */}
            <Card className="lg:hidden px-3 py-2 flex items-center gap-2 rounded-2xl border-border/40 shadow-sm shrink-0">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-base font-bold leading-none">{streak}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">day streak</div>
              </div>
            </Card>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3">
            {/* Study Streak (desktop) / Focus Time (mobile) */}
            <Card className="hidden lg:block p-4 rounded-2xl border-border/40 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Study Streak</span>
              </div>
              <div className="text-3xl font-extrabold leading-none">{streak}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">days</div>
              <div className="flex items-end gap-[3px] h-6 mt-2">
                {[30, 45, 35, 55, 50, 70, 90].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-blue-500/70" style={{ height: `${h}%` }} />
                ))}
              </div>
            </Card>

            <Card className="p-3 lg:p-4 rounded-2xl border-border/40 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Focus Time</span>
              </div>
              <div className="text-xl lg:text-2xl font-extrabold">{focusHrs}h {focusRem}m</div>
              <div className="text-[11px] text-muted-foreground">today</div>
              <svg className="mt-1 w-full h-5" viewBox="0 0 100 24" preserveAspectRatio="none">
                <polyline fill="none" stroke="currentColor" strokeWidth="1.6" className="text-emerald-500"
                  points="0,18 12,16 24,17 36,12 48,14 60,8 72,11 84,6 100,9" />
              </svg>
            </Card>

            <Card className="p-3 lg:p-4 rounded-2xl border-border/40 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Tasks Done</span>
              </div>
              <div className="text-xl lg:text-2xl font-extrabold">{tasksDone}/{tasksGoal}</div>
              <div className="text-[11px] text-muted-foreground">today</div>
              <Progress value={(tasksDone / tasksGoal) * 100} className="h-1 mt-1.5" />
            </Card>

            {/* Mobile-only Study Goal */}
            <Card className="lg:hidden p-3 rounded-2xl border-border/40 shadow-sm col-span-3 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Study Goal</span>
              </div>
              <div className="text-xl font-extrabold">3/5</div>
              <div className="text-[11px] text-muted-foreground">tasks completed</div>
              <Progress value={60} className="h-1 mt-1.5" />
            </Card>
          </div>
        </div>

        {/* Study Plan side panel */}
        <Card className="p-4 lg:p-5 rounded-2xl border-border/40 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-semibold text-sm">Study Plan</span>
            </div>
            <button onClick={() => navigate('/study-planner')} className="text-xs text-primary font-medium hover:underline">View all</button>
          </div>
          <div className="text-[15px] font-bold">Next: Physics Lesson 3</div>
          <div className="text-xs text-muted-foreground">Mechanics — Motion in 2D</div>
          <Progress value={45} className="h-1.5 mt-3" />
          <div className="text-[11px] text-muted-foreground mt-1.5 mb-3">In 45 min</div>
          <Button onClick={() => navigate('/study-planner')} className="w-full rounded-full h-10 text-xs font-semibold shadow-md shadow-primary/20">
            Start Session
          </Button>
        </Card>
      </div>

      {/* Quick-create chip row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 lg:gap-3">
        {createChips.map((c) => (
          <button
            key={c.label}
            onClick={() => navigate(c.to)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 lg:py-3 rounded-2xl bg-card border border-border/30 hover:border-primary/30 hover:shadow-elevated transition-all group"
          >
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.tint} group-hover:scale-105 transition-transform`}>
              <c.icon className="w-3.5 h-3.5" />
            </span>
            <span className="text-[12px] lg:text-[13px] font-semibold whitespace-nowrap">{c.label}</span>
          </button>
        ))}
      </div>

      {/* 3-col: Knowledge Hub / Recent Notes / Flashcards Review */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Knowledge Hub */}
        <Card className="p-4 rounded-2xl border-border/40 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm">My Knowledge Hub</span>
            </div>
            <button onClick={() => navigate('/student-notes')} className="text-muted-foreground hover:text-primary"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            {knowledgeHub.map((h) => (
              <button
                key={h.name}
                onClick={() => navigate(`/subjects?subject=${encodeURIComponent(h.name)}`)}
                className="w-full flex items-center gap-3 group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${h.tint}`}>
                  <h.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold group-hover:text-primary transition-colors">{h.name}</div>
                  <div className="text-[11px] text-muted-foreground">{h.notes} notes · {h.cards} flashcards</div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/student-notes')} className="text-xs text-primary font-medium mt-4 block mx-auto hover:underline">View all</button>
        </Card>

        {/* Recent Notes */}
        <Card className="p-4 rounded-2xl border-border/40 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-600" />
              <span className="font-semibold text-sm">Recent Notes</span>
            </div>
            <button onClick={() => navigate('/student-notes?action=new')} className="text-muted-foreground hover:text-primary"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3.5">
            {recentNotes.map((n) => (
              <button
                key={n.title}
                onClick={() => navigate('/student-notes')}
                className="w-full flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold group-hover:text-primary transition-colors">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground">{n.subject} · {n.when}</div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/student-notes')} className="text-xs text-primary font-medium mt-4 block mx-auto hover:underline">View all</button>
        </Card>

        {/* Flashcards Review */}
        <Card className="p-4 rounded-2xl border-border/40 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-sm">Flashcards Review</span>
            </div>
            <button onClick={() => navigate('/flashcards?action=new')} className="text-muted-foreground hover:text-primary"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3.5">
            {flashDecks.map((d) => {
              const circ = 2 * Math.PI * 16;
              const offset = circ * (1 - d.pct / 100);
              return (
                <button key={d.title} onClick={() => navigate('/flashcards')} className="w-full flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold group-hover:text-primary transition-colors">{d.title}</div>
                    <div className="text-[11px] text-muted-foreground">{d.cards} cards</div>
                  </div>
                  <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" className="stroke-muted" strokeWidth="3" fill="none" />
                      <circle cx="20" cy="20" r="16" className={d.color} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${d.color.split(' ')[0]}`}>{d.pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={() => navigate('/flashcards')} className="text-xs text-primary font-medium mt-4 block mx-auto hover:underline">Review Now</button>
        </Card>
      </div>

      {/* 3-col bottom row: Tasks & Planner / Focus Timer / Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
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
            {[
              { id: '1', title: 'Revise Mechanics', due: 'Today', done: false },
              { id: '2', title: 'Complete Past Paper', due: 'Today', done: true },
              { id: '3', title: 'Read Chapter 5', due: 'Tomorrow', done: false },
              { id: '4', title: 'Do Quiz on Cell', due: 'Tomorrow', done: false },
            ].map((t) => (
              <div key={t.id} className="flex items-center gap-2.5">
                <Checkbox checked={t.done} className="rounded" />
                <span className={`flex-1 text-sm ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.title}</span>
                <span className="text-[11px] text-muted-foreground">{t.due}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/study-planner')} className="text-xs text-primary font-medium mt-3 block mx-auto hover:underline">View all tasks</button>
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
            <div className="text-4xl font-extrabold tracking-tight">25:00</div>
            <div className="text-[11px] text-muted-foreground mt-1.5 mb-3">Stay focused and avoid distractions.</div>
            <Button onClick={() => navigate('/focus-mode')} className="rounded-full px-6 h-9 text-xs font-semibold shadow-md shadow-primary/20">
              Start Focus
            </Button>
          </div>
          <div className="absolute -bottom-3 -right-2 text-5xl opacity-90 select-none">🌱</div>
        </Card>

        {/* Progress (desktop) */}
        <Card className="hidden lg:flex p-4 rounded-2xl border-border/40 shadow-sm flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm">Progress</span>
            </div>
            <button className="text-[11px] text-muted-foreground flex items-center gap-1 hover:text-foreground">
              This Week <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <svg className="w-full h-20" viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="progressArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,45 L28,40 L56,42 L85,30 L114,32 L142,20 L171,22 L200,12 L200,60 L0,60 Z" fill="url(#progressArea)" />
            <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              points="0,45 28,40 56,42 85,30 114,32 142,20 171,22 200,12" />
            {[0, 28, 56, 85, 114, 142, 171, 200].map((x, i) => {
              const ys = [45, 40, 42, 30, 32, 20, 22, 12];
              return <circle key={i} cx={x} cy={ys[i]} r="2" fill="hsl(var(--primary))" />;
            })}
          </svg>
          <div className="grid grid-cols-7 text-[9px] text-muted-foreground text-center mb-3 mt-0.5">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-auto">
            {[
              { label: 'Study Time', val: '12h 30m', delta: '+15%' },
              { label: 'Sessions', val: '8', delta: '+20%' },
              { label: 'Accuracy', val: '78%', delta: '+8%' },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-muted/40 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">{m.label}</div>
                <div className="text-sm font-extrabold mt-0.5">{m.val}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{m.delta}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Upcoming Classes — live from video_rooms */}
      <UpcomingClassesCard />

      {/* AI Shortcuts */}
      <AIShortcutsCard />

      {/* Smart Study Tools */}
      <div>
        <div className="flex items-center gap-2 mb-3 lg:mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base">Smart Study Tools</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {smartTools.map((t) => (
            <button
              key={t.label}
              onClick={() => navigate(t.to)}
              className="text-left p-3.5 lg:p-4 rounded-2xl bg-card border border-border/30 hover:border-primary/30 hover:shadow-elevated transition-all group flex items-start gap-3"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.tint} group-hover:scale-105 transition-transform`}>
                <t.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13px] font-bold truncate">{t.label}</div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom utility dock — desktop only */}
      <Card className="hidden lg:flex p-3 rounded-2xl border-border/40 shadow-sm items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600">
          <Target className="w-4 h-4" />
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">Daily Goal</div>
            <div className="text-sm font-extrabold leading-none">{tasksDone}/{tasksGoal} <span className="text-[10px] font-medium opacity-70">tasks</span></div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3.5 h-10 rounded-xl bg-muted/50 border border-border/30">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search everything..."
            className="bg-transparent flex-1 outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground bg-background border border-border/40 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </div>
        <div className="flex items-center gap-1.5 px-1">
          {[FileText, ImageIcon, CheckCircle2, FolderOpen, Paperclip, StickyNote].map((Icon, i) => (
            <button key={i} className="w-8 h-8 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/voice-notes')} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-muted/60 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-none">Quick Capture</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Voice to note</div>
          </div>
        </button>
      </Card>
    </div>
  );
}
