import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Users, ClipboardCheck, TrendingUp, Calendar, Plus,
  Megaphone, GraduationCap, Trophy, Sparkles, FileText, BookText,
  FlaskConical, Video, ListChecks, ArrowRight,
} from 'lucide-react';

interface Props { userName: string; }

export function TeacherDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  const classes = [
    { name: 'Mathematics - Grade 11A', students: 32, progress: 82, icon: '√' },
    { name: 'Mathematics - Grade 10B', students: 28, progress: 76, icon: 'x²' },
    { name: 'Mathematics - Grade 12A', students: 24, progress: 85, icon: 'π' },
    { name: 'Additional Mathematics - 11B', students: 20, progress: 72, icon: 'ƒx' },
    { name: 'Mathematics Club', students: 15, progress: 68, icon: '★' },
  ];

  const schedule = [
    { time: '08:00 AM', subject: 'Mathematics - Grade 11A', topic: 'Algebraic Expressions', room: 'Room 12', tone: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
    { time: '10:00 AM', subject: 'Mathematics - Grade 10B', topic: 'Quadratic Equations', room: 'Room 08', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
    { time: '01:00 PM', subject: 'Additional Mathematics - 11B', topic: 'Trigonometric Ratios', room: 'Room 15', tone: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300' },
    { time: '02:30 PM', subject: 'Mathematics - Grade 12A', topic: 'Calculus - Derivatives', room: 'Room 05', tone: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' },
  ];

  const assignments = [
    { title: 'Quadratic Equations Worksheet', grade: 'Grade 10B', score: '12/28' },
    { title: 'Algebraic Expressions Quiz', grade: 'Grade 11A', score: '26/32' },
    { title: 'Trigonometry Problem Set', grade: 'Grade 11B', score: '8/20' },
    { title: 'Calculus Derivatives Assignment', grade: 'Grade 12A', score: '18/24' },
  ];

  const announcements = [
    { title: 'ECZ Curriculum Update', desc: 'New Mathematics syllabus guidelines have been released. Please review the updates.', when: '2 days ago', icon: Megaphone, tone: 'text-rose-600 bg-rose-500/10' },
    { title: "Teachers' Workshop", desc: 'Join us for a workshop on AI in Education this Friday.', when: '5 days ago', icon: GraduationCap, tone: 'text-blue-600 bg-blue-500/10' },
    { title: 'End of Term Exams', desc: 'Examination schedule has been published.', when: '1 week ago', icon: FileText, tone: 'text-emerald-600 bg-emerald-500/10' },
  ];

  const resources = [
    { label: 'Lesson Plan Templates', icon: BookText, color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' },
    { label: 'ECZ Syllabus Documents', icon: FileText, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' },
    { label: 'Past Exam Papers', icon: ListChecks, color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' },
    { label: 'Interactive Simulations', icon: FlaskConical, color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10' },
    { label: 'Video Lessons', icon: Video, color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10' },
    { label: 'Question Bank', icon: ClipboardCheck, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10' },
  ];

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge variant="secondary" className="mb-2 uppercase tracking-wider text-[10px]">Teacher</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening in your classes today.</p>
        </div>
        <Card className="px-3 py-2 rounded-2xl border-border/40 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </Card>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: 'My Classes', value: '5', sub: 'Active classes', tint: 'bg-blue-500/10 text-blue-600', link: '/teach' },
          { icon: Users, label: 'Students', value: '126', sub: 'Total students', tint: 'bg-emerald-500/10 text-emerald-600', link: '/teach?tab=students' },
          { icon: ClipboardCheck, label: 'Assignments', value: '8', sub: 'Pending to grade', tint: 'bg-purple-500/10 text-purple-600', link: '/assignments' },
          { icon: TrendingUp, label: 'Avg. Class Progress', value: '78%', sub: 'This month', tint: 'bg-orange-500/10 text-orange-600', link: '/analytics' },
        ].map((s) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Classes */}
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">My Classes</h2>
            <button onClick={() => navigate('/teach')} className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {classes.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">{c.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">{c.students} students</div>
                </div>
                <div className="text-xs font-semibold text-emerald-600 shrink-0">{c.progress}%</div>
              </div>
            ))}
            <button onClick={() => navigate('/teach')} className="w-full text-xs text-primary font-medium mt-2 flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add New Class
            </button>
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Today's Schedule</h2>
            <button onClick={() => navigate('/calendar')} className="text-xs text-primary font-medium">View full calendar</button>
          </div>
          <div className="space-y-3">
            {schedule.map((s) => (
              <div key={s.time} className="flex items-start gap-3">
                <div className="text-[11px] font-semibold text-muted-foreground w-16 shrink-0 pt-0.5">{s.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{s.subject}</div>
                  <div className="text-[11px] text-muted-foreground">{s.topic}</div>
                </div>
                <Badge className={`${s.tone} border-0 text-[10px] shrink-0`}>{s.room}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Assignments */}
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Recent Assignments</h2>
            <button onClick={() => navigate('/assignments')} className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {assignments.map((a) => (
              <div key={a.title} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{a.title}</div>
                  <div className="text-[11px] text-muted-foreground">{a.grade}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold">{a.score}</div>
                  <div className="text-[10px] text-emerald-600">Submitted</div>
                </div>
              </div>
            ))}
            <button onClick={() => navigate('/assignments/new')} className="w-full text-xs text-primary font-medium mt-1 flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Create New Assignment
            </button>
          </div>
        </Card>

        {/* Curriculum Co-Pilot */}
        <Card className="p-4 rounded-2xl border-border/40 bg-gradient-to-br from-primary/5 via-card to-purple-500/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-bold">Curriculum Co-Pilot</h2>
              <Badge className="bg-primary text-primary-foreground text-[9px] h-4">AI</Badge>
            </div>
            <button onClick={() => navigate('/ai-lesson-generator')} className="text-xs text-primary font-medium">Generate with AI</button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Need help with lesson planning? Let Curriculum Co-Pilot create engaging lessons, quizzes, and activities aligned with the ECZ curriculum.
          </p>
          <Button onClick={() => navigate('/ai-lesson-generator')} className="rounded-full px-4 h-9 text-xs">Create with Co-Pilot</Button>
          <div className="absolute -bottom-2 -right-2 text-5xl opacity-40 select-none">🤖</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Announcements */}
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">School Announcements</h2>
            <button className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.title} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${a.tone} flex items-center justify-center shrink-0`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-2">{a.desc}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Resources */}
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Quick Resources</h2>
            <button onClick={() => navigate('/resource-library')} className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {resources.map((r) => (
              <button key={r.label} onClick={() => navigate('/resource-library')} className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-muted transition-colors">
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
