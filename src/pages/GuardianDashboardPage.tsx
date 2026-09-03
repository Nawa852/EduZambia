import React, { useMemo, useState } from 'react';
import { useGuardianData } from '@/hooks/useGuardianData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { GuardianWeeklyReport } from '@/components/Dashboard/GuardianWeeklyReport';
import { Link } from 'react-router-dom';
import { Printer, Link2, BookOpen, Target, TrendingUp, GraduationCap } from 'lucide-react';

/**
 * The parent's home: one honest snapshot per child — grades, course
 * progress and this week's activity — plus a printable/shareable view.
 */
const GuardianDashboardPage: React.FC = () => {
  const { students, loading } = useGuardianData();
  const [activeId, setActiveId] = useState<string | null>(null);

  const child = useMemo(
    () => students.find((s) => s.id === activeId) ?? students[0],
    [students, activeId],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-[22px]" />
        <Skeleton className="h-48 rounded-[22px]" />
      </div>
    );
  }

  if (!students.length) {
    return (
      <EmptyState
        icon={Link2}
        title="No child linked yet"
        description="Link your child's account to see their real grades, study time and teacher updates here."
        actionLabel="Link a child"
        onAction={() => { window.location.href = '/family?tab=link'; }}
      />
    );
  }

  const avgProgress = child.enrollments.length
    ? Math.round(child.enrollments.reduce((a, e) => a + (e.progress || 0), 0) / child.enrollments.length)
    : 0;

  return (
    <div className="space-y-6 print:space-y-4">
      {students.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
                s.id === child.id
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <Card className="rounded-[22px] border-border/50">
        <CardContent className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">{child.name}</h2>
            <p className="text-sm text-muted-foreground">
              {[child.grade, child.school].filter(Boolean).join(' · ') || 'Learner'}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print / share
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Lessons completed" value={child.lessonCompletionsCount} />
        <StatCard icon={Target} label="Quizzes taken" value={child.quizStats.totalAttempts} />
        <StatCard
          icon={TrendingUp}
          label="Average score"
          value={child.quizStats.avgScore > 0 ? `${child.quizStats.avgScore}%` : '--'}
        />
      </div>

      <GuardianWeeklyReport />

      <Card className="rounded-[22px] border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" /> Course progress
            <span className="ml-auto text-xs font-normal text-muted-foreground">{avgProgress}% average</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {child.enrollments.length === 0 && (
            <p className="text-sm text-muted-foreground">No courses started yet.</p>
          )}
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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Class grades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {child.subjects.length === 0 && (
            <p className="text-sm text-muted-foreground">No grades recorded by teachers yet.</p>
          )}
          {child.subjects.map((g, i) => (
            <div
              key={`${g.courseId}-${i}`}
              className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{g.courseTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {[g.term, new Date(g.recordedAt).toLocaleDateString()].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Badge variant="outline" className="rounded-full">
                {g.gradeLetter ?? (g.score !== null ? `${g.score}%` : '--')}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[22px] border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {child.recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing this week yet.</p>
          )}
          {child.recentActivity.slice(0, 12).map((a, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5">
              <span className="truncate pr-3">{a.title}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {a.score ? `${a.score} · ` : ''}
                {new Date(a.time).toLocaleDateString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) => (
  <Card className="rounded-[22px] border-border/50">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-lg font-semibold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default GuardianDashboardPage;
