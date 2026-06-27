import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  BookOpen, Search, ArrowRight, Layers, CheckCircle, Clock, Play, Flame, Sparkles, Trophy, Zap
} from 'lucide-react';

interface EnrolledCourse {
  id: string;
  title: string;
  subject: string | null;
  grade_level: string | null;
  progress: number;
  lesson_count: number;
  completed_count: number;
  enrolled_at: string;
}

const subjectColors: Record<string, string> = {
  Mathematics: 'from-blue-500 to-cyan-500',
  English: 'from-purple-500 to-pink-500',
  Science: 'from-emerald-500 to-green-500',
  Physics: 'from-indigo-500 to-blue-500',
  Chemistry: 'from-orange-500 to-yellow-500',
  Biology: 'from-green-500 to-teal-500',
  Geography: 'from-amber-500 to-orange-500',
  History: 'from-rose-500 to-red-500',
};

const MyCoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, progress, enrolled_at, courses(id, title, subject, grade_level)')
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (enrollments) {
        const courseIds = enrollments.map(e => e.course_id);
        const [{ data: lessons }, { data: completions }] = await Promise.all([
          supabase.from('lessons').select('id, course_id').in('course_id', courseIds.length ? courseIds : ['none']),
          supabase.from('lesson_completions').select('lesson_id, course_id').eq('user_id', user.id),
        ]);

        const lessonMap: Record<string, number> = {};
        lessons?.forEach(l => { lessonMap[l.course_id] = (lessonMap[l.course_id] || 0) + 1; });
        const compMap: Record<string, number> = {};
        completions?.forEach(c => { compMap[c.course_id] = (compMap[c.course_id] || 0) + 1; });

        setCourses(enrollments.map((e: any) => ({
          id: e.courses?.id || e.course_id,
          title: e.courses?.title || 'Course',
          subject: e.courses?.subject,
          grade_level: e.courses?.grade_level,
          progress: e.progress || 0,
          lesson_count: lessonMap[e.course_id] || 0,
          completed_count: compMap[e.course_id] || 0,
          enrolled_at: e.enrolled_at,
        })));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  const totalLessons = courses.reduce((s, c) => s + c.lesson_count, 0);
  const totalCompleted = courses.reduce((s, c) => s + c.completed_count, 0);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> My Courses
          </h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} enrolled · {totalCompleted}/{totalLessons} lessons completed
          </p>
        </div>
        <Button onClick={() => navigate('/course-catalog')}>Browse More Courses</Button>
      </div>

      {/* Overall progress */}
      {totalLessons > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round((totalCompleted / totalLessons) * 100)}%</span>
            </div>
            <Progress value={(totalCompleted / totalLessons) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground mb-4">{courses.length === 0 ? "You haven't enrolled in any courses yet." : 'No matching courses.'}</p>
          {courses.length === 0 && <Button onClick={() => navigate('/course-catalog')}>Explore Courses</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((course, i) => {
            const pct = course.lesson_count > 0 ? (course.completed_count / course.lesson_count) * 100 : 0;
            const gradient = subjectColors[course.subject || ''] || 'from-primary to-accent';
            const isComplete = pct >= 100;
            return (
              <motion.div key={course.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card
                  className="hover:shadow-md transition-all cursor-pointer group border-border/50"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                        {isComplete ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{course.title}</h3>
                          {isComplete && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Complete</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                          {course.subject && <Badge variant="secondary" className="text-[10px]">{course.subject}</Badge>}
                          {course.grade_level && <Badge variant="outline" className="text-[10px]">{course.grade_level}</Badge>}
                          <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{course.completed_count}/{course.lesson_count} lessons</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium text-muted-foreground">{Math.round(pct)}%</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage;
