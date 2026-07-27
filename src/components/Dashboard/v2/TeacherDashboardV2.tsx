import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useTeacherStats } from '@/hooks/useTeacherStats';
import {
  BookOpen, Users, ClipboardCheck, TrendingUp, Calendar, Plus,
  Megaphone, Sparkles, FileText, BookText, FlaskConical, Video,
  ListChecks, ArrowRight, GraduationCap, MessageCircle, UserPlus,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props { userName: string; }

interface AnnouncementRow { id: string; title: string; body: string; created_at: string; }
interface AssignmentRow { id: string; title: string; due_date: string | null; course_id: string; }

const resources = [
  { label: 'Lesson Plans', icon: BookText, to: '/ai-lesson-generator', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' },
  { label: 'ECZ Syllabus', icon: FileText, to: '/repository', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' },
  { label: 'Past Papers', icon: ListChecks, to: '/ecz', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' },
  { label: 'Simulations', icon: FlaskConical, to: '/learn', color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10' },
  { label: 'Video Lessons', icon: Video, to: '/learn?tab=videos', color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10' },
  { label: 'Question Bank', icon: ClipboardCheck, to: '/ai?tab=exam-gen', color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10' },
];

export function TeacherDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courses, totalStudents, pendingCount, avgPerformance, loading } = useTeacherStats();
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [extraLoading, setExtraLoading] = useState(true);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setExtraLoading(false); return; }
      const [{ data: ann }, { data: asg }] = await Promise.all([
        supabase.from('school_announcements')
          .select('id, title, body, created_at')
          .order('created_at', { ascending: false }).limit(4),
        supabase.from('assignments')
          .select('id, title, due_date, course_id')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false }).limit(5),
      ]);
      if (cancelled) return;
      setAnnouncements((ann ?? []) as AnnouncementRow[]);
      setAssignments((asg ?? []) as AssignmentRow[]);
      setExtraLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const chartData = courses
    .filter(c => c.avg_score != null)
    .map(c => ({ name: (c.title || '').slice(0, 12), score: c.avg_score as number }));

  const stats = [
    { icon: BookOpen, label: 'My Classes', value: courses.length, sub: 'Active courses', tint: 'bg-blue-500/10 text-blue-600', link: '/teach' },
    { icon: Users, label: 'Students', value: totalStudents, sub: 'Enrolled', tint: 'bg-emerald-500/10 text-emerald-600', link: '/teach?tab=students' },
    { icon: ClipboardCheck, label: 'To grade', value: pendingCount, sub: 'Submissions', tint: 'bg-purple-500/10 text-purple-600', link: '/teacher/completions' },
    { icon: TrendingUp, label: 'Avg. score', value: avgPerformance ? `${avgPerformance}%` : '—', sub: 'All graded work', tint: 'bg-orange-500/10 text-orange-600', link: '/analytics' },
  ];

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge variant="secondary" className="mb-2 uppercase tracking-wider text-[10px]">Teacher</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Everything from your own classes — nothing simulated.</p>
        </div>
        <Card className="px-3 py-2 rounded-2xl border-border/40 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[124px] rounded-2xl" />)
          : stats.map(s => (
            <Card key={s.label} onClick={() => navigate(s.link)} className="p-4 rounded-2xl border-border/40 cursor-pointer hover:shadow-md transition-all">
              <div className={`w-9 h-9 rounded-xl ${s.tint} flex items-center justify-center mb-3`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-extrabold mt-1">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.sub}</div>
              <div className="text-[11px] text-primary font-medium mt-2 flex items-center gap-1">View <ArrowRight className="w-3 h-3" /></div>
            </Card>
          ))}
      </div>

      {/* Teacher → parent → student connectivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[
          { icon: MessageCircle, label: 'Message parents', desc: 'Send a class or private update', to: '/connect?tab=messenger', tint: 'bg-pink-500/10 text-pink-600' },
          { icon: UserPlus, label: 'Invite students', desc: 'Share a class join code', to: '/teach?tab=students', tint: 'bg-blue-500/10 text-blue-600' },
          { icon: GraduationCap, label: 'Mark completions', desc: 'Review and notify students', to: '/teacher/completions', tint: 'bg-emerald-500/10 text-emerald-600' },
        ].map(a => (
          <Card key={a.label} onClick={() => navigate(a.to)} className="p-4 rounded-2xl border-border/40 cursor-pointer hover:shadow-md transition-all flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${a.tint} flex items-center justify-center shrink-0`}>
              <a.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{a.label}</div>
              <div className="text-[11px] text-muted-foreground truncate">{a.desc}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">My Classes</h2>
            <button onClick={() => navigate('/teach')} className="text-xs text-primary font-medium">View all</button>
          </div>
          {loading ? (
            <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
          ) : courses.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <BookOpen className="w-7 h-7 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">You haven't created a class yet.</p>
              <Button size="sm" className="rounded-full" onClick={() => navigate('/create-course')}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />Create your first class
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 6).map(c => (
                <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="w-full flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {(c.subject || c.title || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.title}</div>
                    <div className="text-[11px] text-muted-foreground">{c.enrollment_count} students · {c.is_published ? 'Published' : 'Draft'}</div>
                  </div>
                  {c.avg_score != null && <div className="text-xs font-semibold text-emerald-600 shrink-0">{c.avg_score}%</div>}
                </button>
              ))}
              <button onClick={() => navigate('/create-course')} className="w-full text-xs text-primary font-medium mt-1 flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add new class
              </button>
            </div>
          )}
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Recent Assignments</h2>
            <button onClick={() => navigate('/assignments')} className="text-xs text-primary font-medium">View all</button>
          </div>
          {extraLoading ? (
            <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
          ) : assignments.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <FileText className="w-7 h-7 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No assignments created yet.</p>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate('/assignments')}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />New assignment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map(a => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString()}` : 'No due date'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Class performance</h2>
            <Badge variant="secondary" className="text-[10px]">Graded work</Badge>
          </div>
          {chartData.length === 0 ? (
            <div className="py-10 text-center space-y-1.5">
              <TrendingUp className="w-7 h-7 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Performance appears once you grade submissions.</p>
            </div>
          ) : (
            <div className="h-[200px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">School announcements</h2>
            <button onClick={() => navigate('/teach')} className="text-xs text-primary font-medium">Post</button>
          </div>
          {extraLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : announcements.length === 0 ? (
            <div className="py-8 text-center space-y-1.5">
              <Megaphone className="w-7 h-7 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No announcements from your school yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2">{a.body}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40 bg-gradient-to-br from-primary/5 via-card to-purple-500/5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-bold">Curriculum Co-Pilot</h2>
            <Badge className="bg-primary text-primary-foreground text-[9px] h-4">AI</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Generate ECZ-aligned lessons, quizzes and activities in seconds.
          </p>
          <Button onClick={() => navigate('/ai-lesson-generator')} className="rounded-full px-4 h-9 text-xs">Create with Co-Pilot</Button>
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <h2 className="font-bold mb-3">Quick resources</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {resources.map(r => (
              <button key={r.label} onClick={() => navigate(r.to)} className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className={`w-10 h-10 rounded-xl ${r.color} flex items-center justify-center`}>
                  <r.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight">{r.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
