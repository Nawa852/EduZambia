import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, GraduationCap, ClipboardCheck, TrendingUp, ShieldCheck,
  UserCog, BookOpen, Calendar, FileText, CheckSquare, DollarSign,
  Library, PieChart, Settings, Megaphone, ArrowRight, Plus,
} from 'lucide-react';

interface Props { userName: string; }

export function SchoolAdminDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  const stats = [
    { icon: Users, label: 'Total Students', value: '1,246', sub: '+28 this term', tint: 'bg-blue-500/10 text-blue-600' },
    { icon: GraduationCap, label: 'Teachers', value: '86', sub: '+4 this term', tint: 'bg-emerald-500/10 text-emerald-600' },
    { icon: ClipboardCheck, label: 'Attendance (Avg)', value: '92%', sub: '+5% this term', tint: 'bg-purple-500/10 text-purple-600' },
    { icon: TrendingUp, label: 'Overall Performance', value: '78%', sub: '+6% this term', tint: 'bg-orange-500/10 text-orange-600' },
  ];

  const quickAccess = [
    { icon: UserCog, label: 'Student Management', tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' },
    { icon: GraduationCap, label: 'Teachers Management', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' },
    { icon: BookOpen, label: 'Classes & Subjects', tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10' },
    { icon: Calendar, label: 'Timetable', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' },
    { icon: FileText, label: 'Exams & Results', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10' },
    { icon: CheckSquare, label: 'Attendance', tint: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10' },
    { icon: DollarSign, label: 'Fees & Payments', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' },
    { icon: Library, label: 'Library', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' },
    { icon: PieChart, label: 'Reports & Analytics', tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10' },
    { icon: Settings, label: 'School Settings', tint: 'bg-muted text-foreground/70' },
  ];

  const activities = [
    { title: 'New student admission', desc: 'John Phiri has been admitted to Grade 10A', when: '2h ago', icon: Users, tint: 'bg-emerald-500/10 text-emerald-600' },
    { title: 'Staff Meeting Scheduled', desc: 'Monthly staff meeting on May 25, 2025 at 10:00 AM', when: '4h ago', icon: Calendar, tint: 'bg-blue-500/10 text-blue-600' },
    { title: 'Term 2 Exams Published', desc: 'Examination timetable is now available', when: '6h ago', icon: FileText, tint: 'bg-purple-500/10 text-purple-600' },
  ];

  const classBreakdown = [
    { label: 'Grade 12', value: 268, color: 'bg-blue-500' },
    { label: 'Grade 11', value: 312, color: 'bg-purple-500' },
    { label: 'Grade 10', value: 298, color: 'bg-orange-500' },
    { label: 'Grade 9', value: 198, color: 'bg-emerald-500' },
    { label: 'Others', value: 170, color: 'bg-rose-500' },
  ];

  const announcements = [
    { title: 'Mid-Term Break', desc: 'School will be closed from May 29 - June 2, 2025. Classes resume on June 3.', date: 'May 20, 2025', icon: Megaphone, tint: 'bg-rose-500/10 text-rose-600' },
    { title: 'Discipline Week', desc: 'Discipline week activities start on June 9, 2025.', date: 'May 18, 2025', icon: ShieldCheck, tint: 'bg-blue-500/10 text-blue-600' },
  ];

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div>
        <Badge variant="secondary" className="mb-2 uppercase tracking-wider text-[10px] text-emerald-700 bg-emerald-500/10 border-0">School Admin</Badge>
        <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, {firstName}! 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening at your school.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 rounded-2xl border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-xl ${s.tint} flex items-center justify-center`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            </div>
            <div className="text-2xl font-extrabold mt-1">{s.value}</div>
            <div className="text-[11px] text-emerald-600 font-medium">{s.sub}</div>
            <svg className="mt-2 w-full h-6" viewBox="0 0 100 24" preserveAspectRatio="none">
              <polyline fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/60"
                points="0,18 15,14 30,15 45,9 60,12 75,7 90,5 100,3" />
            </svg>
          </Card>
        ))}
      </div>

      <Card className="p-4 rounded-2xl border-border/40 bg-gradient-to-r from-emerald-50/60 via-card to-emerald-50/30 dark:from-emerald-500/5 dark:to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">School Verification</div>
              <div className="text-xs text-muted-foreground">Your school profile is 100% complete</div>
            </div>
          </div>
          <button className="text-xs text-emerald-600 font-medium flex items-center gap-1">View Profile <ArrowRight className="w-3 h-3" /></button>
        </div>
      </Card>

      <Card className="p-4 rounded-2xl border-border/40">
        <h2 className="font-bold mb-3">Quick Access</h2>
        <div className="grid grid-cols-5 gap-2.5">
          {quickAccess.map((q) => (
            <button key={q.label} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Recent Activities</h2>
            <button className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a.title} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${a.tint} flex items-center justify-center shrink-0`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">{a.when}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Students by Class</h2>
            <button className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  const total = classBreakdown.reduce((a, c) => a + c.value, 0);
                  let offset = 0;
                  return classBreakdown.map((c) => {
                    const pct = (c.value / total) * 100;
                    const dasharray = `${pct} ${100 - pct}`;
                    const el = (
                      <circle key={c.label} cx="18" cy="18" r="15.915"
                        fill="transparent" strokeWidth="4"
                        stroke={`hsl(var(--background))`}
                        className={c.color.replace('bg-', 'stroke-')}
                        strokeDasharray={dasharray}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += pct;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-lg font-extrabold">1,246</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {classBreakdown.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                  <span className="flex-1">{c.label}</span>
                  <span className="font-semibold">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 rounded-2xl border-border/40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">School Announcements</h2>
          <button className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> New</button>
        </div>
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.title} className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${a.tint} flex items-center justify-center shrink-0`}>
                <a.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-[10px] text-muted-foreground shrink-0">{a.date}</div>
                </div>
                <div className="text-[12px] text-muted-foreground">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
