import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, BookOpen, Plus, Search, Calendar, ClipboardCheck,
  TrendingUp, MoreVertical, ArrowRight, GraduationCap,
} from 'lucide-react';

interface ClassRow {
  id: string;
  name: string;
  subject: string;
  students: number;
  progress: number;
  nextLesson: string;
  room: string;
  color: string;
}

const mockClasses: ClassRow[] = [
  { id: '1', name: 'Mathematics – Grade 11A', subject: 'Mathematics', students: 32, progress: 82, nextLesson: 'Algebraic Expressions', room: 'Room 12', color: 'from-blue-500/20 to-blue-500/5 text-blue-600' },
  { id: '2', name: 'Mathematics – Grade 10B', subject: 'Mathematics', students: 28, progress: 76, nextLesson: 'Quadratic Equations', room: 'Room 08', color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600' },
  { id: '3', name: 'Mathematics – Grade 12A', subject: 'Mathematics', students: 24, progress: 85, nextLesson: 'Calculus – Derivatives', room: 'Room 05', color: 'from-purple-500/20 to-purple-500/5 text-purple-600' },
  { id: '4', name: 'Additional Mathematics – 11B', subject: 'Add. Math', students: 20, progress: 72, nextLesson: 'Trigonometric Ratios', room: 'Room 15', color: 'from-amber-500/20 to-amber-500/5 text-amber-600' },
  { id: '5', name: 'Mathematics Club', subject: 'Enrichment', students: 22, progress: 68, nextLesson: 'Problem Solving', room: 'Lab 02', color: 'from-rose-500/20 to-rose-500/5 text-rose-600' },
];

export default function TeacherMyClassesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const list = mockClasses.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const totalStudents = mockClasses.reduce((a, c) => a + c.students, 0);
  const avgProgress = Math.round(mockClasses.reduce((a, c) => a + c.progress, 0) / mockClasses.length);

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-5 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">My Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your active classes, students, and lessons.</p>
        </div>
        <Button onClick={() => navigate('/teach?tab=lesson-plans')} className="rounded-full gap-2">
          <Plus className="w-4 h-4" /> Add New Class
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: 'My Classes', value: mockClasses.length, sub: 'Active classes', tint: 'bg-blue-500/10 text-blue-600' },
          { icon: Users, label: 'Total Students', value: totalStudents, sub: 'Across all classes', tint: 'bg-emerald-500/10 text-emerald-600' },
          { icon: ClipboardCheck, label: 'Pending Grading', value: 8, sub: 'Submissions', tint: 'bg-purple-500/10 text-purple-600' },
          { icon: TrendingUp, label: 'Avg. Progress', value: `${avgProgress}%`, sub: 'This term', tint: 'bg-amber-500/10 text-amber-600' },
        ].map(s => (
          <Card key={s.label} className="p-4 rounded-2xl border-border/40 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.tint} flex items-center justify-center`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-extrabold">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search classes…" className="pl-9 rounded-full" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {/* Class list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {list.map(c => (
          <Card key={c.id} className="p-4 rounded-2xl border-border/40 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/teach?tab=gradebook&class=${c.id}`)}>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shrink-0`}>
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" /> {c.students} students
                      <span>•</span>
                      <span>{c.room}</span>
                    </div>
                  </div>
                  <button className="opacity-60 hover:opacity-100 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={c.progress} className="h-1.5 flex-1" />
                  <span className="text-xs font-semibold text-emerald-600 shrink-0">{c.progress}%</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-border/40">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Next: </span>
                    <span className="font-medium">{c.nextLesson}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {[
          { icon: ClipboardCheck, label: 'Take Attendance', to: '/teach?tab=attendance', color: 'bg-blue-500/10 text-blue-600' },
          { icon: Plus, label: 'Create Assignment', to: '/teach?tab=lesson-plans', color: 'bg-emerald-500/10 text-emerald-600' },
          { icon: Calendar, label: 'View Schedule', to: '/teach', color: 'bg-purple-500/10 text-purple-600' },
          { icon: Users, label: 'Message Students', to: '/connect?tab=messenger', color: 'bg-rose-500/10 text-rose-600' },
        ].map(q => (
          <Card key={q.label} onClick={() => navigate(q.to)}
                className="p-4 rounded-2xl border-border/40 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${q.color} flex items-center justify-center shrink-0`}>
              <q.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold">{q.label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
