import { useState, useEffect } from 'react';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen, Brain, Target, Trophy, Clock, ArrowRight,
  CheckCircle, Flame, TrendingUp, Sparkles,
  ClipboardCheck, GraduationCap, Monitor
} from 'lucide-react';
import { XPBar } from '@/components/Gamification/XPBar';
import { useUserStats } from '@/hooks/useUserStats';
import { useScreenTime } from '@/hooks/useScreenTime';
import { DailyCheckin } from '@/components/Dashboard/DailyCheckin';
import { StreakCalendar } from '@/components/Dashboard/StreakCalendar';
import { QuickQuizWidget } from '@/components/Dashboard/QuickQuizWidget';
import { StudyTimerWidget } from '@/components/Dashboard/StudyTimerWidget';
import { CourseRecommendations } from '@/components/Dashboard/CourseRecommendations';
import { AnnouncementFeed } from '@/components/Dashboard/AnnouncementFeed';
import { ReadingProgressTracker } from '@/components/Dashboard/ReadingProgressTracker';
import { GradeCalculator } from '@/components/Dashboard/GradeCalculator';
import { StudentSpotlight } from '@/components/Dashboard/StudentSpotlight';
import { CollaborationLauncher } from '@/components/Dashboard/CollaborationLauncher';
import { AIStudySummary } from '@/components/Dashboard/AIStudySummary';
import { StudyScheduleCTA } from '@/components/Dashboard/StudyScheduleCTA';
import { ProfileCompletenessCard } from '@/components/Dashboard/ProfileCompletenessCard';
import { ReminderPermissionBanner } from '@/components/Dashboard/ReminderPermissionBanner';

interface EnrolledCourse {
  id: string;
  title: string;
  subject: string | null;
  grade_level: string | null;
  progress: number;
  lesson_count: number;
  completed_count: number;
}

interface UpcomingAssignment {
  id: string;
  title: string;
  due_date: string | null;
  course_title: string;
  course_id: string;
  max_score: number;
  is_submitted: boolean;
}

interface DashboardStats {
  totalCourses: number;
  completedLessons: number;
  totalLessons: number;
  averageProgress: number;
  streak: number;
}

const subjectColors: Record<string, string> = {
  Mathematics: 'from-blue-500 to-cyan-500',
  English: 'from-purple-500 to-pink-500',
  Science: 'from-emerald-500 to-green-500',
  Physics: 'from-indigo-500 to-blue-500',
  Chemistry: 'from-orange-500 to-yellow-500',
  Biology: 'from-green-500 to-teal-500',
};

export const StudentDashboardView = ({ userName }: { userName: string }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [assignments, setAssignments] = useState<UpcomingAssignment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalCourses: 0, completedLessons: 0, totalLessons: 0, averageProgress: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const { stats: userStats } = useUserStats();
  const { todayMinutes } = useScreenTime();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, progress, courses(id, title, subject, grade_level)')
        .eq('user_id', user.id);

      if (enrollments) {
        const courseIds = enrollments.map(e => e.course_id);
        const [{ data: lessons }, { data: completions }] = await Promise.all([
          supabase.from('lessons').select('id, course_id').in('course_id', courseIds.length ? courseIds : ['none']),
          supabase.from('lesson_completions').select('lesson_id, course_id, completed_at').eq('user_id', user.id),
        ]);

        const lessonMap: Record<string, number> = {};
        lessons?.forEach(l => { lessonMap[l.course_id] = (lessonMap[l.course_id] || 0) + 1; });
        const completionMap: Record<string, number> = {};
        completions?.forEach(c => { completionMap[c.course_id] = (completionMap[c.course_id] || 0) + 1; });

        const enrolledCourses: EnrolledCourse[] = enrollments.map((e: any) => ({
          id: e.courses?.id || e.course_id,
          title: e.courses?.title || 'Course',
          subject: e.courses?.subject,
          grade_level: e.courses?.grade_level,
          progress: e.progress || 0,
          lesson_count: lessonMap[e.course_id] || 0,
          completed_count: completionMap[e.course_id] || 0,
        }));

        setCourses(enrolledCourses);

        const totalLessons = enrolledCourses.reduce((s, c) => s + c.lesson_count, 0);
        const completedLessons = enrolledCourses.reduce((s, c) => s + c.completed_count, 0);
        const allCompletionDates = completions?.map(c => new Date(c.completed_at).toISOString().split('T')[0]) || [];
        const uniqueDates = [...new Set(allCompletionDates)].sort().reverse();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let streak = 0;
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          streak = 1;
          for (let i = 1; i < uniqueDates.length; i++) {
            const diff = (new Date(uniqueDates[i - 1]).getTime() - new Date(uniqueDates[i]).getTime()) / 86400000;
            if (diff === 1) streak++; else break;
          }
        }

        setStats({ totalCourses: enrolledCourses.length, completedLessons, totalLessons, averageProgress: enrolledCourses.length > 0 ? enrolledCourses.reduce((s, c) => s + c.progress, 0) / enrolledCourses.length : 0, streak });

        if (courseIds.length > 0) {
          const { data: assignmentsData } = await supabase
            .from('assignments')
            .select('id, title, due_date, max_score, course_id, courses:course_id(title)')
            .in('course_id', courseIds)
            .order('due_date', { ascending: true })
            .limit(5);

          const { data: subs } = await supabase.from('submissions').select('assignment_id').eq('user_id', user.id);
          const submittedSet = new Set(subs?.map(s => s.assignment_id) || []);

          if (assignmentsData) {
            setAssignments(assignmentsData.map((a: any) => ({ ...a, course_title: a.courses?.title || 'Course', is_submitted: submittedSet.has(a.id) })));
          }
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return <div className="py-12"><LogoLoader text="Loading dashboard..." /></div>;
  }

  return (
    <div className="space-y-6">
      <ReminderPermissionBanner />
      <StudyScheduleCTA />
      <ProfileCompletenessCard />

      {/* Daily Check-in */}
      <DailyCheckin />

      {/* XP Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <XPBar />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-primary bg-primary/10' },
          { label: 'Lessons', value: `${stats.completedLessons}/${stats.totalLessons}`, icon: CheckCircle, color: 'text-accent bg-accent/10' },
          { label: 'Progress', value: `${Math.round(stats.averageProgress)}%`, icon: TrendingUp, color: 'text-primary bg-primary/10' },
          { label: 'Due', value: assignments.filter(a => !a.is_submitted).length, icon: ClipboardCheck, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Study', value: `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`, icon: Monitor, color: 'text-muted-foreground bg-muted' },
        ].map((s, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning */}
          <ReadingProgressTracker />

          {/* My Courses */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="w-4.5 h-4.5 text-primary" /> My Courses
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/learn?tab=catalog')}>
                  Browse <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground mb-3">No courses yet</p>
                  <Button size="sm" onClick={() => navigate('/learn?tab=catalog')}>
                    <Sparkles className="w-4 h-4 mr-1" /> Explore Courses
                  </Button>
                </div>
              ) : (
                courses.slice(0, 4).map(course => {
                  const gradient = subjectColors[course.subject || ''] || 'from-primary to-accent';
                  const pct = course.lesson_count > 0 ? (course.completed_count / course.lesson_count) * 100 : 0;
                  return (
                    <div
                      key={course.id}
                      onClick={() => navigate(`/course/${course.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/20 cursor-pointer transition-all"
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{course.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">
                            {course.completed_count}/{course.lesson_count}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Announcements */}
          <AnnouncementFeed />

          {/* Assignments */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" /> Upcoming Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No assignments yet 🎉</p>
              ) : (
                assignments.slice(0, 4).map(a => (
                  <div key={a.id} onClick={() => navigate(`/course/${a.course_id}/assignments`)}
                    className="p-3 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors border border-border/30">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      {a.is_submitted ? (
                        <Badge variant="secondary" className="text-[10px] shrink-0">Done</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] shrink-0">Pending</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span>{a.course_title}</span>
                      {a.due_date && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-5">
          <StreakCalendar />
          <StudyTimerWidget />
          <QuickQuizWidget />
          <AIStudySummary />
          <GradeCalculator />
          <CourseRecommendations />
          <CollaborationLauncher />
          <StudentSpotlight />
        </div>
      </div>
    </div>
  );
};
