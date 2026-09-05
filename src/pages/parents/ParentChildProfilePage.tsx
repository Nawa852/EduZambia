import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuardianData } from '@/hooks/useGuardianData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { ArrowLeft, Printer, Timer, Target, BookOpen, Link2 } from 'lucide-react';

/** One child, everything a parent needs, on a single page. */
const ParentChildProfilePage: React.FC = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { students, loading } = useGuardianData();
  const child = students.find((s) => s.id === studentId);

  if (loading) return <div className="space-y-4"><Skeleton className="h-28 rounded-[22px]" /><Skeleton className="h-64 rounded-[22px]" /></div>;

  if (!child) {
    return (
      <EmptyState
        icon={Link2}
        title="Child not found"
        description="This child is not linked to your account yet."
        actionLabel="Link a child"
        onAction={() => navigate('/family?tab=link')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/family?tab=children')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft className="w-4 h-4" /> All children
      </button>

      <Card className="rounded-[22px] border-border/50">
        <CardContent className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">{child.name}</h2>
            <p className="text-sm text-muted-foreground">{[child.grade, child.school].filter(Boolean).join(' · ') || 'Learner'}</p>
          </div>
          <Button variant="outline" className="rounded-xl print:hidden" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print / share
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat icon={BookOpen} label="Lessons done" value={child.lessonCompletionsCount} />
        <Stat icon={Target} label="Quizzes" value={child.quizStats.totalAttempts} />
        <Stat icon={Target} label="Average score" value={child.quizStats.avgScore > 0 ? `${child.quizStats.avgScore}%` : '--'} />
        <Stat icon={Timer} label="Focus minutes" value={child.focusStats.totalMinutes} />
      </div>

      <Card className="rounded-[22px] border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Course progress</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {child.enrollments.length === 0 && <p className="text-sm text-muted-foreground">No courses started yet.</p>}
          {child.enrollments.map((e) => (
            <div key={e.courseId} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{e.courseTitle}</span>
                <span className="text-muted-foreground">{Math.round(e.progress || 0)}%</span>
              </div>
              <Progress value={e.progress || 0} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[22px] border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Grades from teachers</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {child.subjects.length === 0 && <p className="text-sm text-muted-foreground">No grades recorded yet.</p>}
          {child.subjects.map((g, i) => (
            <div key={`${g.courseId}-${i}`} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div>
                <p className="text-sm font-medium">{g.courseTitle}</p>
                <p className="text-xs text-muted-foreground">{[g.term, new Date(g.recordedAt).toLocaleDateString()].filter(Boolean).join(' · ')}</p>
              </div>
              <Badge variant="outline" className="rounded-full">{g.gradeLetter ?? (g.score !== null ? `${g.score}%` : '--')}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[22px] border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Recent activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {child.recentActivity.length === 0 && <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>}
          {child.recentActivity.slice(0, 15).map((a, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5">
              <span className="truncate pr-3">{a.title}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{a.score ? `${a.score} · ` : ''}{new Date(a.time).toLocaleDateString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) => (
  <Card className="rounded-[22px] border-border/50">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
      <div>
        <p className="text-lg font-semibold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default ParentChildProfilePage;
