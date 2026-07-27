import { useState, useEffect } from 'react';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClipboardCheck, Clock, CheckCircle, Upload, Send, FileText,
  Star, MessageSquare, AlertTriangle
} from 'lucide-react';

interface AssignmentWithCourse {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  course_id: string;
  course_title: string;
  course_subject: string | null;
}

interface Submission {
  id: string;
  assignment_id: string;
  content: string | null;
  file_url: string | null;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

const MyAssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithCourse[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState<string | null>(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      // Get enrolled course IDs
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id);

      if (!enrollments?.length) { setLoading(false); return; }
      const courseIds = enrollments.map(e => e.course_id);

      // Fetch assignments for enrolled courses
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*, courses:course_id(title, subject)')
        .in('course_id', courseIds)
        .order('due_date', { ascending: true, nullsFirst: false });

      // Fetch student's submissions
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id);

      if (assignmentsData) {
        setAssignments(assignmentsData.map((a: any) => ({
          ...a,
          course_title: a.courses?.title || 'Unknown Course',
          course_subject: a.courses?.subject || null,
        })));
      }
      if (subs) {
        const map = new Map<string, Submission>();
        subs.forEach(s => map.set(s.assignment_id, s));
        setSubmissions(map);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const submitAssignment = async (assignmentId: string) => {
    if (!user) { setLoading(false); return; }
    setSubmitting(true);
    let fileUrl: string | null = null;
    if (submitFile) {
      const ext = submitFile.name.split('.').pop();
      const path = `assignments/${user.id}/${assignmentId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(path, submitFile);
      if (uploadError) { toast.error('File upload failed'); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }
    const { data, error } = await supabase.from('submissions').insert({
      assignment_id: assignmentId,
      user_id: user.id,
      content: submitContent.trim() || null,
      file_url: fileUrl,
    }).select().single();
    if (error) toast.error('Submission failed');
    else if (data) {
      setSubmissions(prev => new Map(prev).set(assignmentId, data));
      toast.success('Assignment submitted!');
      setSubmitOpen(null); setSubmitContent(''); setSubmitFile(null);
    }
    setSubmitting(false);
  };

  const isOverdue = (date: string | null) => date ? new Date(date) < new Date() : false;
  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const pending = assignments.filter(a => !submissions.has(a.id));
  const submitted = assignments.filter(a => submissions.has(a.id) && !submissions.get(a.id)!.graded_at);
  const graded = assignments.filter(a => submissions.get(a.id)?.graded_at);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <LogoLoader text="Loading assignments..." />
      </div>
    );
  }

  const AssignmentCard = ({ a }: { a: AssignmentWithCourse }) => {
    const sub = submissions.get(a.id);
    const overdue = isOverdue(a.due_date);
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">{a.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{a.course_title}{a.course_subject ? ` · ${a.course_subject}` : ''}</p>
                {a.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline"><Star className="w-3 h-3 mr-1" />{a.max_score} pts</Badge>
                  {a.due_date && (
                    <Badge variant={overdue && !sub ? 'destructive' : 'outline'}>
                      <Clock className="w-3 h-3 mr-1" />
                      {overdue ? 'Overdue' : `Due ${formatDate(a.due_date)}`}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {sub ? (
                  sub.graded_at ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" />{sub.score}/{a.max_score}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Submitted</Badge>
                  )
                ) : (
                  <Button size="sm" onClick={() => setSubmitOpen(a.id)}>
                    <Upload className="w-4 h-4 mr-1" /> Submit
                  </Button>
                )}
              </div>
            </div>
            {sub?.feedback && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Teacher Feedback
                </p>
                <p className="text-sm text-foreground">{sub.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-primary" /> My Assignments
        </h1>
        <p className="text-sm text-muted-foreground">{assignments.length} total across all courses</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No assignments yet</p>
            <p className="text-sm mt-1">Enroll in courses to receive assignments from teachers.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1">
              <AlertTriangle className="w-3 h-3" /> Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="gap-1">
              <FileText className="w-3 h-3" /> Submitted ({submitted.length})
            </TabsTrigger>
            <TabsTrigger value="graded" className="gap-1">
              <CheckCircle className="w-3 h-3" /> Graded ({graded.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-3 mt-4">
            {pending.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">All caught up! 🎉</CardContent></Card>
            ) : pending.map(a => <AssignmentCard key={a.id} a={a} />)}
          </TabsContent>
          <TabsContent value="submitted" className="space-y-3 mt-4">
            {submitted.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No pending submissions.</CardContent></Card>
            ) : submitted.map(a => <AssignmentCard key={a.id} a={a} />)}
          </TabsContent>
          <TabsContent value="graded" className="space-y-3 mt-4">
            {graded.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No graded assignments yet.</CardContent></Card>
            ) : graded.map(a => <AssignmentCard key={a.id} a={a} />)}
          </TabsContent>
        </Tabs>
      )}

      {/* Submit Dialog */}
      <Dialog open={!!submitOpen} onOpenChange={() => setSubmitOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Your Answer</Label><Textarea value={submitContent} onChange={e => setSubmitContent(e.target.value)} placeholder="Type your answer..." rows={5} /></div>
            <div>
              <Label>Attach File (optional)</Label>
              <Input type="file" onChange={e => setSubmitFile(e.target.files?.[0] || null)} className="mt-1" />
            </div>
            <Button className="w-full" onClick={() => submitOpen && submitAssignment(submitOpen)} disabled={submitting || (!submitContent.trim() && !submitFile)}>
              {submitting ? 'Submitting...' : 'Submit'} <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyAssignmentsPage;
