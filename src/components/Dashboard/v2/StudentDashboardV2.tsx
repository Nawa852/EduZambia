import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Flame, CheckCircle2, Clock, ChevronRight,
  Camera, Sparkles, BookOpen, Layers, Share2,
  FolderOpen, StickyNote, ListChecks, HelpCircle,
  Folder, Bot, ScanLine, FileType2, Link2, Repeat,
  FileText, ArrowUpRight, Bell, Play, WifiOff, Plus,
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useStudentSnapshot } from '@/hooks/useStudentSnapshot';
import UpcomingClassesCard from '@/components/Dashboard/UpcomingClassesCard';
import { isStudentFeature } from '@/config/studentFeatures';
import LearningCircle from '@/components/Study/LearningCircle';
import AIShortcutsCard from '@/components/Dashboard/AIShortcutsCard';
import { ProductTour } from '@/components/Onboarding/ProductTour';

/** Weekly focus target used for the progress ring on the focus card. */
const WEEKLY_FOCUS_GOAL = 300;

interface Props { userName: string; }

export function StudentDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: snapshot, isLoading: snapLoading } = useStudentSnapshot();
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; due: string; done: boolean }>>([]);
  const [recentNotes, setRecentNotes] = useState<Array<{ id: string; title: string; when: string }>>([]);
  const [flashDecks, setFlashDecks] = useState<Array<{ id: string; title: string; cards: number; pct: number }>>([]);
  const [weekFocus, setWeekFocus] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [dataLoading, setDataLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);



  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const weekAgo = new Date(Date.now() - 6 * 864e5); weekAgo.setHours(0, 0, 0, 0);
      const [notesRes, decksRes, goalsRes, focusRes] = await Promise.all([
        supabase.from('student_notes').select('id, title, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(4),
        supabase.from('flashcard_decks').select('id, title, flashcard_cards(id, repetitions)').eq('user_id', user.id).limit(4),
        supabase.from('study_goals').select('id, title, due_date, completed').eq('user_id', user.id).order('due_date', { ascending: true }).limit(5),
        supabase.from('focus_sessions').select('focus_minutes, started_at').eq('user_id', user.id).gte('started_at', weekAgo.toISOString()),
      ]);
      if (cancelled) return;

      setRecentNotes((notesRes.data || []).map((n: any) => ({
        id: n.id, title: n.title || 'Untitled note',
        when: new Date(n.updated_at).toLocaleDateString(),
      })));

      setFlashDecks((decksRes.data || []).map((d: any) => {
        const cards = d.flashcard_cards || [];
        const reviewed = cards.filter((c: any) => (c.repetitions ?? 0) > 0).length;
        return { id: d.id, title: d.title, cards: cards.length, pct: cards.length ? Math.round((reviewed / cards.length) * 100) : 0 };
      }));

      setTasks((goalsRes.data || []).map((g: any) => ({
        id: g.id, title: g.title,
        due: g.due_date ? new Date(g.due_date).toLocaleDateString() : 'No date',
        done: !!g.completed,
      })));

      const buckets = [0, 0, 0, 0, 0, 0, 0];
      (focusRes.data || []).forEach((f: any) => {
        const idx = 6 - Math.min(6, Math.floor((Date.now() - new Date(f.started_at).getTime()) / 864e5));
        if (idx >= 0) buckets[idx] += f.focus_minutes || 0;
      });
      setWeekFocus(buckets);
      setDataLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const firstName = userName.split(' ')[0];
  const streak = snapshot?.streak ?? 0;
  const unread = snapshot?.unread_notifications ?? 0;
  const todayFocus = snapshot?.focus_minutes_today ?? weekFocus[6] ?? 0;
  const focusHrs = Math.floor(todayFocus / 60);
  const focusRem = todayFocus % 60;
  const tasksDone = tasks.filter(t => t.done).length;
  const tasksGoal = tasks.length;
  const maxFocus = Math.max(...weekFocus, 1);
  const weekTotal = useMemo(() => weekFocus.reduce((a, b) => a + b, 0), [weekFocus]);
  const weekPct = Math.min(100, Math.round((weekTotal / WEEKLY_FOCUS_GOAL) * 100));
  const resume = recentNotes[0];
  const showSkeleton = dataLoading && snapLoading;


  const quickActions = [
    { icon: StickyNote, label: 'New Note', tint: 'text-blue-600 bg-blue-500/10', to: '/student-notes?action=new' },
    { icon: Layers, label: 'Flashcards', tint: 'text-emerald-600 bg-emerald-500/10', to: '/flashcards?action=new' },
    { icon: ListChecks, label: 'New Task', tint: 'text-amber-600 bg-amber-500/10', to: '/study-planner?action=new' },
    { icon: HelpCircle, label: 'New Quiz', tint: 'text-rose-600 bg-rose-500/10', to: '/practice?tab=quiz' },
    { icon: Folder, label: 'Folder', tint: 'text-violet-600 bg-violet-500/10', to: '/student-notes?folder=new' },
  ];

  const smartTools = [
    { icon: Bot, label: 'AI Chat', desc: 'Streaming markdown answers', tint: 'bg-violet-500/10 text-violet-600', to: '/synapse?tab=ask' },
    { icon: Camera, label: 'Snap & Solve', desc: 'Photo of homework → solve', tint: 'bg-rose-500/10 text-rose-600', to: '/synapse?tab=snap' },
    { icon: ScanLine, label: 'Document Scan', desc: 'Scan notes and extract text', tint: 'bg-blue-500/10 text-blue-600', to: '/scan' },
    { icon: FileType2, label: 'PDF Reader', desc: 'Read, highlight, annotate', tint: 'bg-amber-500/10 text-amber-600', to: '/pdf-reader' },
    { icon: Link2, label: 'Web Clipper', desc: 'Save articles and resources', tint: 'bg-emerald-500/10 text-emerald-600', to: '/student-notes?source=web' },
    { icon: Layers, label: 'Flashcards', desc: 'Create and review active recall', tint: 'bg-emerald-500/10 text-emerald-600', to: '/flashcards' },
    { icon: HelpCircle, label: 'Quiz Generator', desc: 'Generate quizzes from any content', tint: 'bg-amber-500/10 text-amber-600', to: '/practice?tab=quiz' },
    { icon: Share2, label: 'Mind Map', desc: 'Visualize and connect ideas', tint: 'bg-teal-500/10 text-teal-600', to: '/mind-maps' },
    { icon: Repeat, label: 'Spaced Repetition', desc: 'Smart review, better retention', tint: 'bg-indigo-500/10 text-indigo-600', to: '/flashcards?mode=spaced' },
  ];

  return (
    <div className="space-y-5 lg:space-y-6 pb-4">
      <ProductTour role="student" />

      {/* Greeting + streak */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[26px] lg:text-[32px] font-extrabold tracking-[-0.03em] leading-tight">
            {greeting()}, {firstName}! <span className="inline-block">👋</span>
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1">Let's make today count.</p>
        </div>
        <Card data-tour="streak" className="px-4 py-2.5 flex items-center gap-2.5 rounded-2xl border-border/40 shadow-sm shrink-0">
          <Flame className="w-5 h-5 text-orange-500" />
          <div>
            <div className="text-[20px] font-extrabold leading-none">{streak}</div>
            <div className="text-[10.5px] text-muted-foreground mt-0.5">Day streak</div>
          </div>
        </Card>
      </div>

      {/* Focus / Tasks */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <Card className="p-4 rounded-[22px] border-border/40 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="text-[13px] font-semibold">Focus Time</span>
          </div>
          <div className="text-[28px] lg:text-[32px] font-extrabold tracking-[-0.03em] leading-none">{focusHrs}h {focusRem}m</div>
          <div className="text-[12px] text-muted-foreground mt-1">today</div>
          <div className="flex items-end gap-[3px] h-8 mt-3">
            {weekFocus.map((m, i) => (
              <div key={i} className="flex-1 rounded-full bg-emerald-500/70 min-h-[3px]" style={{ height: `${(m / maxFocus) * 100}%` }} />
            ))}
          </div>
        </Card>

        <Card className="p-4 rounded-[22px] border-border/40 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-violet-600" />
            </span>
            <span className="text-[13px] font-semibold">Tasks Done</span>
          </div>
          <div className="text-[28px] lg:text-[32px] font-extrabold tracking-[-0.03em] leading-none">{tasksDone}</div>
          <div className="text-[12px] text-muted-foreground mt-1">done today</div>
          <Progress value={tasksGoal > 0 ? (tasksDone / tasksGoal) * 100 : 0} className="h-1.5 mt-4" />
        </Card>
      </div>

      {/* Study plan */}
      <Card data-tour="study-plan" className="p-4 lg:p-5 rounded-[22px] border-border/40 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[10px] bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </span>
            <span className="font-semibold text-[15px]">Study Plan</span>
          </div>
          <button onClick={() => navigate('/study-planner')} className="text-[13px] text-primary font-medium hover:underline">View all</button>
        </div>
        <div className="text-[17px] font-bold tracking-[-0.02em]">{tasks.find(t => !t.done)?.title ?? 'No task scheduled'}</div>
        <div className="text-[13px] text-muted-foreground mt-0.5">
          {tasks.length ? `${tasksDone} of ${tasksGoal} goals complete · due ${tasks.find(t => !t.done)?.due ?? '—'}` : 'Add a study goal to plan your day.'}
        </div>
        <Button
          onClick={() => navigate('/practice?tab=focus')}
          className="w-full mt-4 rounded-full h-12 text-[15px] font-semibold bg-gradient-to-r from-primary to-violet-600 hover:opacity-95 shadow-lg shadow-primary/25 justify-between px-5"
        >
          <span className="flex-1 text-center">Start Session</span>
          <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </span>
        </Button>
      </Card>

      {/* Learning circle */}
      <LearningCircle variant="summary" />

      {/* Quick actions */}
      <section data-tour="quick-tools">
        <h2 className="text-[15px] font-bold tracking-[-0.02em] mb-2.5">Quick actions</h2>
        <div className="grid grid-cols-5 gap-2 lg:gap-3">
          {quickActions.map((c) => (
            <button
              key={c.label}
              onClick={() => navigate(c.to)}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-[18px] bg-card border border-border/40 hover:border-primary/30 hover:shadow-elevated transition-all active:scale-[0.97]"
            >
              <span className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${c.tint}`}>
                <c.icon className="w-4 h-4" />
              </span>
              <span className="text-[10.5px] lg:text-[12px] font-semibold text-center leading-tight">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Synapse It */}
      <button
        onClick={() => navigate('/synapse')}
        className="w-full text-left rounded-[22px] border border-primary/20 bg-gradient-to-br from-primary/[0.12] via-violet-500/[0.08] to-transparent p-4 hover:shadow-elevated transition-all group"
      >
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-[16px] bg-primary/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[16px] leading-tight tracking-[-0.02em]">Synapse It</div>
            <p className="text-[12.5px] text-muted-foreground leading-snug mt-0.5">
              Drop notes, a past paper or a photo to get started
            </p>
          </div>
          <span className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-violet-600 text-primary-foreground flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
            <ArrowUpRight className="w-5 h-5" />
          </span>
        </div>
      </button>

      {/* AI shortcuts */}
      <div data-tour="ai-shortcuts"><AIShortcutsCard /></div>

      {/* Smart study tools */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-[17px] tracking-[-0.02em]">Smart Study Tools</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 lg:gap-3">
          {smartTools.map((t) => (
            <button
              key={t.label}
              onClick={() => navigate(t.to)}
              className="text-left p-3.5 rounded-[18px] bg-card border border-border/40 hover:border-primary/30 hover:shadow-elevated transition-all active:scale-[0.98] group flex items-start gap-3"
            >
              <span className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${t.tint} group-hover:scale-105 transition-transform`}>
                <t.icon className="w-4 h-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold leading-tight tracking-[-0.01em]">{t.label}</span>
                <span className="block text-[11.5px] text-muted-foreground leading-snug mt-0.5">{t.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent work */}
      {(recentNotes.length > 0 || flashDecks.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          {recentNotes.length > 0 && (
            <Card className="p-4 rounded-[22px] border-border/40 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-600" />
                  <span className="font-semibold text-[14px]">Recent notes</span>
                </div>
                <button onClick={() => navigate('/student-notes')} className="text-[12px] text-primary font-medium hover:underline">View all</button>
              </div>
              <div className="space-y-3">
                {recentNotes.map((n) => (
                  <button key={n.id} onClick={() => navigate('/student-notes')} className="w-full flex items-center gap-3 group text-left">
                    <span className="w-9 h-9 rounded-[12px] bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13.5px] font-semibold truncate group-hover:text-primary transition-colors">{n.title}</span>
                      <span className="block text-[11.5px] text-muted-foreground">{n.when}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {flashDecks.length > 0 && (
            <Card className="p-4 rounded-[22px] border-border/40 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-[14px]">Decks to review</span>
                </div>
                <button onClick={() => navigate('/flashcards')} className="text-[12px] text-primary font-medium hover:underline">Review now</button>
              </div>
              <div className="space-y-3">
                {flashDecks.map((d) => {
                  const circ = 2 * Math.PI * 16;
                  return (
                    <button key={d.id} onClick={() => navigate('/flashcards')} className="w-full flex items-center gap-3 group text-left">
                      <span className="w-9 h-9 rounded-[12px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13.5px] font-semibold truncate group-hover:text-primary transition-colors">{d.title}</span>
                        <span className="block text-[11.5px] text-muted-foreground">{d.cards} cards</span>
                      </span>
                      <span className="relative w-10 h-10 shrink-0">
                        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="16" className="stroke-muted" strokeWidth="3" fill="none" />
                          <circle cx="20" cy="20" r="16" className="stroke-emerald-500" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - d.pct / 100)} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-600">{d.pct}%</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Library shortcut */}
      <button
        onClick={() => navigate('/practice?tab=resources')}
        className="w-full flex items-center gap-3 p-4 rounded-[22px] bg-card border border-border/40 hover:border-primary/30 transition-all text-left"
      >
        <span className="w-10 h-10 rounded-[14px] bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
          <FolderOpen className="w-4.5 h-4.5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-bold">Your library</span>
          <span className="block text-[12px] text-muted-foreground">Everything you have uploaded, organised</span>
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      {isStudentFeature('video_rooms') && <div data-tour="upcoming"><UpcomingClassesCard /></div>}
    </div>
  );
}

export default StudentDashboardV2;
