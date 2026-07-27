import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import {
  Users, GraduationCap, ClipboardCheck, TrendingUp, ShieldCheck,
  UserCog, BookOpen, Calendar, FileText, CheckSquare, DollarSign,
  Library, PieChart, Settings, Megaphone, ArrowRight, Plus,
} from 'lucide-react';

interface Props { userName: string; }

const quickAccess = [
  { icon: UserCog, label: 'Students', tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10', to: '/school?tab=students' },
  { icon: GraduationCap, label: 'Teachers', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', to: '/school?tab=teachers' },
  { icon: BookOpen, label: 'Classes', tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10', to: '/school?tab=classes' },
  { icon: Calendar, label: 'Timetable', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10', to: '/calendar' },
  { icon: FileText, label: 'Exams', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10', to: '/school?tab=exams' },
  { icon: CheckSquare, label: 'Attendance', tint: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10', to: '/school?tab=attendance' },
  { icon: DollarSign, label: 'Fees', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', to: '/school?tab=fees' },
  { icon: Library, label: 'Library', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10', to: '/repository' },
  { icon: PieChart, label: 'Reports', tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10', to: '/analytics' },
  { icon: Settings, label: 'Settings', tint: 'bg-muted text-foreground/70', to: '/settings' },
];

interface Announcement { id: string; title: string; body: string; created_at: string; }

export function SchoolAdminDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<string | null>(null);
  const [students, setStudents] = useState(0);
  const [teachers, setTeachers] = useState(0);
  const [courses, setCourses] = useState(0);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [gradeBreakdown, setGradeBreakdown] = useState<{ label: string; value: number }[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setLoading(false); return; }
      const { data: me } = await supabase.from('profiles').select('school').eq('id', user.id).maybeSingle();
      const mySchool = me?.school ?? null;

      const base = () => {
        let q = supabase.from('profiles').select('grade', { count: 'exact' });
        if (mySchool) q = q.eq('school', mySchool);
        return q;
      };

      const [studentsRes, teachersRes, coursesRes, gradesRes, annRes] = await Promise.all([
        base().eq('role', 'student'),
        base().eq('role', 'teacher'),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('grades').select('score').limit(500),
        mySchool
          ? supabase.from('school_announcements').select('id, title, body, created_at').eq('school', mySchool).order('created_at', { ascending: false }).limit(5)
          : supabase.from('school_announcements').select('id, title, body, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      if (cancelled) return;
      setSchool(mySchool);
      setStudents(studentsRes.count ?? 0);
      setTeachers(teachersRes.count ?? 0);
      setCourses(coursesRes.count ?? 0);

      const scores = (gradesRes.data ?? []).map(g => Number(g.score)).filter(n => !isNaN(n));
      setAvgScore(scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null);

      const counts: Record<string, number> = {};
      (studentsRes.data ?? []).forEach((p: any) => {
        const key = p.grade ? `Grade ${String(p.grade).replace(/^grade\s*/i, '')}` : 'Unspecified';
        counts[key] = (counts[key] ?? 0) + 1;
      });
      setGradeBreakdown(Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6));
      setAnnouncements((annRes.data ?? []) as Announcement[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const stats = [
    { icon: Users, label: 'Students', value: students, tint: 'bg-blue-500/10 text-blue-600' },
    { icon: GraduationCap, label: 'Teachers', value: teachers, tint: 'bg-emerald-500/10 text-emerald-600' },
    { icon: ClipboardCheck, label: 'Courses', value: courses, tint: 'bg-purple-500/10 text-purple-600' },
    { icon: TrendingUp, label: 'Avg. result', value: avgScore != null ? `${avgScore}%` : '—', tint: 'bg-orange-500/10 text-orange-600' },
  ];

  const totalBreakdown = gradeBreakdown.reduce((a, g) => a + g.value, 0);
  const palette = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'];

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div>
        <Badge variant="secondary" className="mb-2 uppercase tracking-wider text-[10px] text-emerald-700 bg-emerald-500/10 border-0">School Admin</Badge>
        <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, {firstName}! 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">{school ? `Live figures for ${school}.` : 'Set your school in Settings to scope these figures.'}</p>
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
            </Card>
          ))}
      </div>

      {!school && !loading && (
        <Card className="p-4 rounded-2xl border-border/40 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Finish your school profile</div>
              <div className="text-xs text-muted-foreground">Add your school name so figures only count your learners.</div>
            </div>
          </div>
          <button onClick={() => navigate('/settings')} className="text-xs text-primary font-medium flex items-center gap-1">Open settings <ArrowRight className="w-3 h-3" /></button>
        </Card>
      )}

      <Card className="p-4 rounded-2xl border-border/40">
        <h2 className="font-bold mb-3">Quick access</h2>
        <div className="grid grid-cols-4 lg:grid-cols-5 gap-2.5">
          {quickAccess.map(q => (
            <button key={q.label} onClick={() => navigate(q.to)} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
              <div className={`w-11 h-11 rounded-2xl ${q.tint} flex items-center justify-center`}>
                <q.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">{q.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <h2 className="font-bold mb-3">Students by grade</h2>
          {loading ? (
            <Skeleton className="h-28 rounded-xl" />
          ) : totalBreakdown === 0 ? (
            <div className="py-8 text-center space-y-1.5">
              <Users className="w-7 h-7 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No students registered under your school yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {gradeBreakdown.map((g, i) => (
                <div key={g.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{g.label}</span>
                    <span className="font-semibold">{g.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${palette[i % palette.length]}`} style={{ width: `${(g.value / totalBreakdown) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Announcements</h2>
            <button onClick={() => navigate('/school?tab=announcements')} className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> New</button>
          </div>
          {loading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : announcements.length === 0 ? (
            <div className="py-8 text-center space-y-1.5">
              <Megaphone className="w-7 h-7 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No announcements published yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold truncate">{a.title}</div>
                      <div className="text-[10px] text-muted-foreground shrink-0">{new Date(a.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-[12px] text-muted-foreground line-clamp-2">{a.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
