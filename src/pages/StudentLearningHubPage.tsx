import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PlayCircle, Target, Sparkles, Clock, ArrowRight } from 'lucide-react';

interface CourseRow { id: string; title: string; subject: string | null; description: string | null; }
interface Enroll { course_id: string; progress: number; courses: CourseRow | null; }
interface Lesson { id: string; title: string; course_id: string; order_index: number | null; duration_minutes: number | null; }
interface Goal { id: string; title: string; target_minutes: number | null; completed_minutes: number | null; due_date: string | null; }

const StudentLearningHubPage = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enroll[]>([]);
  const [recommended, setRecommended] = useState<Lesson[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [enr, courses, gls] = await Promise.all([
        supabase.from('enrollments').select('course_id, progress, courses(id,title,subject,description)').eq('user_id', user.id),
        supabase.from('courses').select('id').limit(50),
        supabase.from('study_goals').select('id,title,target_minutes,completed_minutes,due_date').eq('user_id', user.id).order('due_date', { ascending: true }).limit(5),
      ]);
      setEnrollments((enr.data as any) || []);
      const enrolledIds = new Set(((enr.data as any) || []).map((e: any) => e.course_id));
      const targetCourses = (courses.data || []).map(c => c.id).filter(id => enrolledIds.has(id)).slice(0, 4);
      if (targetCourses.length) {
        const { data: lessons } = await supabase.from('lessons').select('id,title,course_id,order_index,duration_minutes').in('course_id', targetCourses).order('order_index').limit(6);
        setRecommended(lessons || []);
      }
      setGoals(gls.data || []);
      setLoading(false);
    })();
  }, [user]);

  const todayPlan = goals.slice(0, 3);

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="h-7 w-7 text-primary" /> Learning Hub</h1>
        <p className="text-muted-foreground">Your courses, next lessons and study plan for today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Course Progress</CardTitle><CardDescription>Your active courses</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
              enrollments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-3">You haven't enrolled in any courses yet.</p>
                  <Button asChild><Link to="/learn?tab=catalog">Browse Courses</Link></Button>
                </div>
              ) : enrollments.map(e => (
                <div key={e.course_id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <Link to={`/course/${e.course_id}`} className="font-medium hover:underline">{e.courses?.title || 'Course'}</Link>
                    <span className="text-muted-foreground">{Math.round(e.progress || 0)}%</span>
                  </div>
                  <Progress value={e.progress || 0} className="h-2" />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Today's Plan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {todayPlan.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals set. <Link to="/prepare?tab=planner" className="text-primary underline">Create one</Link>.</p>
            ) : todayPlan.map(g => {
              const pct = g.target_minutes ? Math.min(100, ((g.completed_minutes || 0) / g.target_minutes) * 100) : 0;
              return (
                <div key={g.id} className="space-y-1">
                  <div className="flex justify-between text-sm"><span>{g.title}</span><span className="text-muted-foreground">{g.completed_minutes || 0}/{g.target_minutes || 0}m</span></div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Recommended Lessons</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {recommended.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full">Enroll in a course to get recommendations.</p>
          ) : recommended.map(l => (
            <Link key={l.id} to={`/course/${l.course_id}`} className="rounded-xl border p-4 hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{l.title}</p>
                  {l.duration_minutes && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Clock className="h-3 w-3" />{l.duration_minutes} min</p>}
                </div>
                <PlayCircle className="h-5 w-5 text-primary shrink-0" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link to="/student/analytics"><ArrowRight className="mr-2 h-4 w-4" />View Analytics</Link></Button>
        <Button asChild variant="outline"><Link to="/student/quizzes">Take a Quiz</Link></Button>
        <Button asChild variant="outline"><Link to="/prepare?tab=assignments">My Assignments</Link></Button>
      </div>
    </div>
  );
};

export default StudentLearningHubPage;
