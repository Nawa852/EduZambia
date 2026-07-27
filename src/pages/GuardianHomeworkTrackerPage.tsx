import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardCheck, Clock, CheckCircle, AlertTriangle, Inbox } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

const GuardianHomeworkTrackerPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data: links, error } = await (supabase as any).from('guardian_links').select('student_id').eq('guardian_id', user.id).eq('status', 'active');
      if (error) { toast.error('Failed to load data'); setLoading(false); return; }
      if (!links?.length) { setLoading(false); return; }
      const studentIds = links.map((l: any) => l.student_id);
      const { data: enrollments } = await supabase.from('enrollments').select('course_id, user_id').in('user_id', studentIds);
      if (!enrollments?.length) { setLoading(false); return; }
      const courseIds = [...new Set(enrollments.map(e => e.course_id))];
      const { data: allAssignments } = await supabase.from('assignments').select('*').in('course_id', courseIds).order('due_date', { ascending: true });
      const { data: submissions } = await (supabase as any).from('submissions').select('assignment_id, user_id, score').in('user_id', studentIds);
      const { data: courses } = await supabase.from('courses').select('id, title').in('id', courseIds);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', studentIds);
      const cMap = Object.fromEntries((courses || []).map(c => [c.id, c.title]));
      const pMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
      const subMap = new Set((submissions || []).map((s: any) => `${s.assignment_id}_${s.user_id}`));

      const enriched = (allAssignments || []).flatMap(a =>
        studentIds.filter((sid: string) => enrollments.some(e => e.course_id === a.course_id && e.user_id === sid))
          .map((sid: string) => ({
            ...a, student_name: pMap[sid] || 'Student', course_title: cMap[a.course_id],
            submitted: subMap.has(`${a.id}_${sid}`), overdue: a.due_date && isPast(new Date(a.due_date)),
          }))
      );
      setAssignments(enriched);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  );

  const overdue = assignments.filter(a => a.overdue && !a.submitted);
  const pending = assignments.filter(a => !a.submitted && !a.overdue);
  const done = assignments.filter(a => a.submitted);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-primary" /> Homework Tracker</h1>
        <p className="text-sm text-muted-foreground">Track your children's assignments</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><AlertTriangle className="w-5 h-5 mx-auto text-destructive mb-1" /><p className="text-2xl font-bold">{overdue.length}</p><p className="text-xs text-muted-foreground">Overdue</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Clock className="w-5 h-5 mx-auto text-yellow-500 mb-1" /><p className="text-2xl font-bold">{pending.length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CheckCircle className="w-5 h-5 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{done.length}</p><p className="text-xs text-muted-foreground">Submitted</p></CardContent></Card>
      </div>

      {assignments.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="font-medium">No assignments found</p><p className="text-sm text-muted-foreground mt-1">Your linked children have no assignments yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {[...overdue, ...pending, ...done].map((a, i) => (
            <Card key={`${a.id}-${i}`} className={`border-border/50 ${a.overdue && !a.submitted ? 'border-destructive/30' : ''}`}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">{a.course_title}</Badge>
                    <Badge variant="outline" className="text-[10px]">{a.student_name}</Badge>
                    {a.due_date && <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(a.due_date), { addSuffix: true })}</span>}
                  </div>
                </div>
                {a.submitted ? <Badge className="bg-green-600 text-[10px]">Submitted</Badge> :
                  a.overdue ? <Badge variant="destructive" className="text-[10px]">Overdue</Badge> :
                  <Badge variant="outline" className="text-[10px]">Pending</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardianHomeworkTrackerPage;
