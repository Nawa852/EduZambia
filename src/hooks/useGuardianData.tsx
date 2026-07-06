import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface LinkedStudent {
  id: string;
  name: string;
  grade: string;
  school: string;
  avatarUrl: string | null;
  linkId: string;
  relationship: string;
  mode: string;
  subjects: StudentGrade[];
  enrollments: StudentEnrollment[];
  recentActivity: ActivityItem[];
  quizStats: { totalAttempts: number; avgScore: number };
  lessonCompletionsCount: number;
  focusStats: { totalMinutes: number; sessionsCompleted: number; gaveUpCount: number; distractionCount: number };
}

export interface StudentGrade {
  courseId: string;
  courseTitle: string;
  score: number | null;
  gradeLetter: string | null;
  term: string | null;
  recordedAt: string;
}

export interface StudentEnrollment {
  courseId: string;
  courseTitle: string;
  progress: number;
}

export interface ActivityItem {
  type: 'lesson' | 'quiz' | 'grade';
  title: string;
  time: string;
  score?: string;
}

export interface WeeklySummary {
  lessonsCompleted: number;
  quizzesTaken: number;
  avgScore: number;
  focusMinutes: number;
  focusSessions: number;
  gaveUpCount: number;
}

export function useGuardianData() {
  const { user } = useAuth();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({ lessonsCompleted: 0, quizzesTaken: 0, avgScore: 0, focusMinutes: 0, focusSessions: 0, gaveUpCount: 0 });

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Get guardian links
      const { data: links, error: linksErr } = await supabase
        .from('guardian_links')
        .select('id, student_id, guardian_id, guardian_name, relationship, mode, status, created_at')
        .eq('guardian_id', user.id)
        .eq('status', 'active');

      if (linksErr || !links || links.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = links.map(l => l.student_id);

      // 2. Fetch profiles for all linked students
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, school, grade, province')
        .in('id', studentIds);

      // 3. Fetch grades for linked students
      const { data: grades } = await supabase
        .from('grades')
        .select('*')
        .in('student_id', studentIds);

      // 4. Fetch enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, courses(title)')
        .in('user_id', studentIds);

      // 5. Fetch lesson completions (last 7 days for weekly summary + recent activity)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: lessonCompletions } = await supabase
        .from('lesson_completions')
        .select('*, lessons(title)')
        .in('user_id', studentIds)
        .gte('completed_at', weekAgo)
        .order('completed_at', { ascending: false })
        .limit(50);

      // 6. Fetch quiz attempts (last 7 days)
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .in('user_id', studentIds)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false });

      // 7. Fetch focus sessions (last 7 days)
      const { data: focusSessions } = await supabase
        .from('focus_sessions' as any)
        .select('*')
        .in('user_id', studentIds)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false });

      // 7. Fetch course titles for grades
      const courseIds = [...new Set([
        ...(grades || []).map(g => g.course_id),
        ...(enrollments || []).map(e => e.course_id),
      ])];
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds.length > 0 ? courseIds : ['none']);

      const courseMap = new Map((courses || []).map(c => [c.id, c.title]));

      // Build student objects
      const result: LinkedStudent[] = links.map(link => {
        const profile = (profiles || []).find(p => p.id === link.student_id);
        const studentGrades = (grades || []).filter(g => g.student_id === link.student_id);
        const studentEnrollments = (enrollments || []).filter(e => e.user_id === link.student_id);
        const studentLessons = (lessonCompletions || []).filter(lc => lc.user_id === link.student_id);
        const studentQuizzes = (quizAttempts || []).filter(q => q.user_id === link.student_id);
        const studentFocus = ((focusSessions as any[]) || []).filter((f: any) => f.user_id === link.student_id);

        const quizScores = studentQuizzes.map(q => (q.correct_answers / q.total_questions) * 100);
        const avgQuizScore = quizScores.length > 0 ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : 0;

        // Focus stats
        const totalFocusMinutes = studentFocus.reduce((sum: number, f: any) => sum + (f.focus_minutes || 0), 0);
        const focusCompleted = studentFocus.filter((f: any) => !f.gave_up).reduce((sum: number, f: any) => sum + (f.sessions_completed || 0), 0);
        const focusGaveUp = studentFocus.filter((f: any) => f.gave_up).length;
        const focusDistractions = studentFocus.reduce((sum: number, f: any) => sum + (f.distraction_count || 0), 0);

        // Recent activity: combine lessons + quizzes + focus, sort by time
        const activity: ActivityItem[] = [
          ...studentLessons.slice(0, 5).map(lc => ({
            type: 'lesson' as const,
            title: `Completed: ${(lc as any).lessons?.title || 'Lesson'}`,
            time: new Date(lc.completed_at).toLocaleDateString(),
          })),
          ...studentQuizzes.slice(0, 5).map(q => ({
            type: 'quiz' as const,
            title: `${q.subject} Quiz`,
            time: new Date(q.created_at).toLocaleDateString(),
            score: `${Math.round((q.correct_answers / q.total_questions) * 100)}%`,
          })),
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

        return {
          id: link.student_id,
          name: profile?.full_name || 'Student',
          grade: profile?.grade || '',
          school: profile?.school || '',
          avatarUrl: profile?.avatar_url || null,
          linkId: link.id,
          relationship: link.relationship,
          mode: link.mode,
          subjects: studentGrades.map(g => ({
            courseId: g.course_id,
            courseTitle: courseMap.get(g.course_id) || 'Course',
            score: g.score,
            gradeLetter: g.grade_letter,
            term: g.term,
            recordedAt: g.created_at,
          })),
          enrollments: studentEnrollments.map(e => ({
            courseId: e.course_id,
            courseTitle: (e as any).courses?.title || courseMap.get(e.course_id) || 'Course',
            progress: Number(e.progress) || 0,
          })),
          recentActivity: activity,
          quizStats: { totalAttempts: studentQuizzes.length, avgScore: avgQuizScore },
          lessonCompletionsCount: studentLessons.length,
          focusStats: { totalMinutes: totalFocusMinutes, sessionsCompleted: focusCompleted, gaveUpCount: focusGaveUp, distractionCount: focusDistractions },
        };
      });

      // Weekly summary across all students
      const totalLessons = (lessonCompletions || []).length;
      const totalQuizzes = (quizAttempts || []).length;
      const allScores = (quizAttempts || []).map(q => (q.correct_answers / q.total_questions) * 100);
      const overallAvg = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
      const allFocus = ((focusSessions as any[]) || []);
      const totalFocusMins = allFocus.reduce((s: number, f: any) => s + (f.focus_minutes || 0), 0);
      const totalFocusSess = allFocus.filter((f: any) => !f.gave_up).reduce((s: number, f: any) => s + (f.sessions_completed || 0), 0);
      const totalGaveUp = allFocus.filter((f: any) => f.gave_up).length;

      setWeeklySummary({ lessonsCompleted: totalLessons, quizzesTaken: totalQuizzes, avgScore: overallAvg, focusMinutes: totalFocusMins, focusSessions: totalFocusSess, gaveUpCount: totalGaveUp });
      setStudents(result);
    } catch (err) {
      console.error('Error fetching guardian data:', err);
    } finally {
      setLoading(false);
    }
  }

  return { students, loading, weeklySummary, refetch: fetchData };
}
