import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, Bell, ClipboardCheck } from 'lucide-react';

interface CourseOpt { id: string; title: string; }
interface Row {
  user_id: string; lesson_id: string; completed_at: string;
  profile?: { full_name: string | null } | null;
  lesson?: { title: string; course_id: string } | null;
}

const TeacherCompletionsPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [courseId, setCourseId] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('courses').select('id,title').eq('instructor_id', user.id).then(({ data }) => {
      setCourses(data || []);
      if (data?.[0]) setCourseId(data[0].id);
    });
  }, [user]);

  const load = async () => {
    if (!courseId) return;
    setLoading(true);
    const { data: lessons } = await supabase.from('lessons').select('id,title,course_id').eq('course_id', courseId);
    const lessonIds = (lessons || []).map(l => l.id);
    if (!lessonIds.length) { setRows([]); setLoading(false); return; }
    const { data: comps } = await supabase.from('lesson_completions')
      .select('user_id, lesson_id, completed_at')
      .in('lesson_id', lessonIds)
      .order('completed_at', { ascending: false })
      .limit(100);
    const userIds = [...new Set((comps || []).map(c => c.user_id))];
    const { data: profs } = userIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
      : { data: [] as any[] };
    const profMap = Object.fromEntries((profs || []).map(p => [p.id, p]));
    const lessonMap = Object.fromEntries((lessons || []).map(l => [l.id, l]));
    setRows((comps || []).map(c => ({ ...c, profile: profMap[c.user_id] || null, lesson: lessonMap[c.lesson_id] || null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseId]);

  const notify = async (r: Row) => {
    const { error } = await supabase.from('notifications').insert({
      user_id: r.user_id,
      type: 'lesson_reviewed',
      title: 'Lesson reviewed by your teacher',
      message: `Great work completing "${r.lesson?.title || 'the lesson'}". Keep going!`,
      link: `/course/${r.lesson?.course_id}`,
    } as any);
    if (error) return toast.error(error.message);
    toast.success('Student notified');
  };

  const notifyAll = async () => {
    if (!rows.length) return;
    const inserts = rows.map(r => ({
      user_id: r.user_id,
      type: 'lesson_reviewed',
      title: 'Progress review from your teacher',
      message: `Reviewed your completion of "${r.lesson?.title || 'a lesson'}". Well done!`,
      link: `/course/${r.lesson?.course_id}`,
    }));
    const { error } = await supabase.from('notifications').insert(inserts as any);
    if (error) return toast.error(error.message);
    toast.success(`Notified ${inserts.length} students`);
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ClipboardCheck className="h-7 w-7 text-primary" /> Completion Review</h1>
        <p className="text-muted-foreground">Review recent lesson completions and notify students.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Recent Completions</CardTitle>
            <CardDescription>{rows.length} entries</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={notifyAll} disabled={!rows.length}>
              <Bell className="h-4 w-4 mr-2" />Notify All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
            courses.length === 0 ? <p className="text-sm text-muted-foreground">You don't have any courses yet.</p> :
            rows.length === 0 ? <p className="text-sm text-muted-foreground">No completions yet for this course.</p> :
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/40">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.profile?.full_name || 'Student'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.lesson?.title || 'Lesson'} · {new Date(r.completed_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Reviewed</Badge>
                    <Button size="sm" variant="outline" onClick={() => notify(r)}><Bell className="h-4 w-4 mr-1" />Notify</Button>
                  </div>
                </div>
              ))}
            </div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherCompletionsPage;
