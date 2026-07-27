import { useState, useEffect } from 'react';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
  TrendingUp, BookOpen, Trophy, Target, Clock, GraduationCap, Flame, BarChart3
} from 'lucide-react';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const ProgressReportPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<any[]>([]);
  const [gradeData, setGradeData] = useState<any[]>([]);
  const [completionData, setCompletionData] = useState<any[]>([]);
  const [stats, setStats] = useState({ courses: 0, avgProgress: 0, lessonsCompleted: 0, avgGrade: 0 });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const [{ data: enrollments }, { data: completions }, { data: grades }] = await Promise.all([
        supabase.from('enrollments').select('course_id, progress, courses(title, subject)').eq('user_id', user.id),
        supabase.from('lesson_completions').select('completed_at, course_id').eq('user_id', user.id).order('completed_at'),
        supabase.from('grades').select('score, course_id, created_at, courses:course_id(title, subject)').eq('student_id', user.id).order('created_at'),
      ]);

      // Course progress chart
      const courses = (enrollments || []).map((e: any) => ({
        name: e.courses?.title?.substring(0, 15) || 'Course',
        subject: e.courses?.subject || 'Other',
        progress: Math.round(e.progress || 0),
      }));
      setCourseData(courses);

      // Grade distribution
      const gradeEntries = (grades || []).map((g: any) => ({
        name: g.courses?.title?.substring(0, 12) || 'Course',
        score: g.score || 0,
        date: new Date(g.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      }));
      setGradeData(gradeEntries);

      // Completion trend (last 14 days)
      const now = new Date();
      const days: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        days[d.toISOString().split('T')[0]] = 0;
      }
      (completions || []).forEach((c: any) => {
        const key = c.completed_at?.split('T')[0];
        if (key && days[key] !== undefined) days[key]++;
      });
      setCompletionData(Object.entries(days).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
        lessons: count,
      })));

      const avgProgress = courses.length > 0 ? courses.reduce((s: number, c: any) => s + c.progress, 0) / courses.length : 0;
      const avgGrade = gradeEntries.length > 0 ? gradeEntries.reduce((s: number, g: any) => s + g.score, 0) / gradeEntries.length : 0;

      setStats({
        courses: courses.length,
        avgProgress: Math.round(avgProgress),
        lessonsCompleted: (completions || []).length,
        avgGrade: Math.round(avgGrade),
      });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <LogoLoader text="Loading report..." />
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Progress Report
        </h1>
        <p className="text-sm text-muted-foreground">Your learning performance overview</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Courses', value: stats.courses, icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Lessons Done', value: stats.lessonsCompleted, icon: Trophy, color: 'text-purple-500 bg-purple-500/10' },
          { label: 'Avg Grade', value: stats.avgGrade > 0 ? `${stats.avgGrade}%` : '—', icon: GraduationCap, color: 'text-amber-500 bg-amber-500/10' },
        ].map((s, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Course Progress */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {courseData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Enroll in courses to see progress</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={courseData} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Trend */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lessons Completed (14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="lessons" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grade History */}
        <motion.div variants={fadeUp} className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Grade History</CardTitle>
            </CardHeader>
            <CardContent>
              {gradeData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No grades recorded yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProgressReportPage;
