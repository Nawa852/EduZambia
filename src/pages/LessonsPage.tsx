import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  GraduationCap, Play, CheckCircle, Lock, Clock, BookOpen, Search,
  Sparkles, ArrowRight, Filter,
} from 'lucide-react';

type Lesson = {
  id: number;
  title: string;
  subject: string;
  duration: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'available' | 'locked';
  grade: string;
};

const subjectTint: Record<string, string> = {
  Mathematics: 'bg-blue-500/10 text-blue-600',
  English: 'bg-purple-500/10 text-purple-600',
  Biology: 'bg-emerald-500/10 text-emerald-600',
  Physics: 'bg-indigo-500/10 text-indigo-600',
  Chemistry: 'bg-orange-500/10 text-orange-600',
  Geography: 'bg-amber-500/10 text-amber-600',
};

const LESSONS: Lesson[] = [
  { id: 1, title: 'Introduction to Algebra', subject: 'Mathematics', duration: '45 min', progress: 100, status: 'completed', grade: 'Grade 9' },
  { id: 2, title: 'Quadratic Equations', subject: 'Mathematics', duration: '60 min', progress: 75, status: 'in-progress', grade: 'Grade 10' },
  { id: 3, title: 'Cell Biology Essentials', subject: 'Biology', duration: '50 min', progress: 0, status: 'available', grade: 'Grade 11' },
  { id: 4, title: "Newton's Laws of Motion", subject: 'Physics', duration: '55 min', progress: 100, status: 'completed', grade: 'Grade 12' },
  { id: 5, title: 'Chemical Bonding', subject: 'Chemistry', duration: '40 min', progress: 30, status: 'in-progress', grade: 'Grade 11' },
  { id: 6, title: 'Essay Writing Skills', subject: 'English', duration: '35 min', progress: 0, status: 'available', grade: 'Grade 9' },
  { id: 7, title: 'Map Reading & Scale', subject: 'Geography', duration: '40 min', progress: 0, status: 'locked', grade: 'Grade 10' },
  { id: 8, title: 'Photosynthesis Deep Dive', subject: 'Biology', duration: '45 min', progress: 0, status: 'locked', grade: 'Grade 12' },
];

const LessonsPage = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState<string>('all');
  const [query, setQuery] = useState('');

  const subjects = useMemo(() => ['all', ...Array.from(new Set(LESSONS.map(l => l.subject)))], []);
  const filtered = LESSONS.filter(
    l => (subject === 'all' || l.subject === subject) && l.title.toLowerCase().includes(query.toLowerCase()),
  );

  const completed = LESSONS.filter(l => l.status === 'completed').length;
  const inProgress = LESSONS.filter(l => l.status === 'in-progress').length;
  const overall = Math.round(LESSONS.reduce((s, l) => s + l.progress, 0) / LESSONS.length);

  const statusBadge = (s: Lesson['status']) => {
    if (s === 'completed') return <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">Done</Badge>;
    if (s === 'in-progress') return <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[10px]">In progress</Badge>;
    if (s === 'locked') return <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">Locked</Badge>;
    return <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Start</Badge>;
  };

  const statusIcon = (s: Lesson['status']) => {
    if (s === 'completed') return <CheckCircle className="w-5 h-5" />;
    if (s === 'locked') return <Lock className="w-5 h-5" />;
    return <Play className="w-5 h-5" />;
  };

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <div className="text-2xl font-extrabold">{completed}</div>
        </Card>
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Play className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground">In progress</span>
          </div>
          <div className="text-2xl font-extrabold">{inProgress}</div>
        </Card>
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground">Overall</span>
          </div>
          <div className="text-2xl font-extrabold">{overall}%</div>
          <Progress value={overall} className="h-1 mt-1.5" />
        </Card>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search lessons..." className="pl-9 rounded-xl" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {subjects.map(s => (
            <Button
              key={s}
              size="sm"
              variant={subject === s ? 'default' : 'outline'}
              className="rounded-full text-xs h-9 px-3 shrink-0"
              onClick={() => setSubject(s)}
            >
              {s === 'all' ? 'All subjects' : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Lesson grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(l => {
          const tint = subjectTint[l.subject] || 'bg-primary/10 text-primary';
          const locked = l.status === 'locked';
          return (
            <Card
              key={l.id}
              onClick={() => !locked && navigate('/learn?tab=catalog')}
              className={`p-4 rounded-2xl border-border/40 transition-all ${locked ? 'opacity-60' : 'hover:shadow-md hover:border-primary/30 cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl ${tint} flex items-center justify-center shrink-0`}>
                  {statusIcon(l.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{l.title}</h3>
                    {statusBadge(l.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mb-2">
                    <Badge variant="secondary" className="text-[10px] rounded-full">{l.subject}</Badge>
                    <Badge variant="outline" className="text-[10px] rounded-full">{l.grade}</Badge>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{l.duration}</span>
                  </div>
                  {l.progress > 0 && l.progress < 100 && (
                    <div className="flex items-center gap-2">
                      <Progress value={l.progress} className="h-1.5 flex-1" />
                      <span className="text-[11px] font-medium text-muted-foreground">{l.progress}%</span>
                    </div>
                  )}
                </div>
                {!locked && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-10 text-center rounded-2xl border-dashed">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No lessons match your filters.</p>
        </Card>
      )}
    </div>
  );
};

export default LessonsPage;
