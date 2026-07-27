import { useState, useEffect } from 'react';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardCheck, ArrowLeft, Upload, FileText, Clock, CheckCircle,
  Plus, Star, MessageSquare, Send
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  course_id: string;
  created_by: string | null;
  course?: { title: string; subject: string | null };
}

interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  content: string | null;
  file_url: string | null;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
  student?: { full_name: string | null };
}

const AssignmentPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  // Create assignment state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMaxScore, setNewMaxScore] = useState('100');
  const [creating, setCreating] = useState(false);

  // Submit state
  const [submitOpen, setSubmitOpen] = useState<string | null>(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Grade state
  const [gradeOpen, setGradeOpen] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (!courseId || !user) return;
    const fetchData = async () => {
      // Check if user is course creator (teacher)
      const { data: course } = await supabase
        .from('courses')
        .select('created_by')
        .eq('id', courseId)
        .single();

      const teacher = course?.created_by === user.id;
      setIsTeacher(teacher);

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*, courses:course_id(title, subject)')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (assignmentsData) {
        setAssignments(assignmentsData.map((a: any) => ({ ...a, course: a.courses })));

        if (teacher) {
          // Teacher: fetch all submissions for these assignments
          const assignmentIds = assignmentsData.map(a => a.id);
          if (assignmentIds.length > 0) {
            const { data: subs } = await supabase
              .from('submissions')
              .select('*, profiles:user_id(full_name)')
              .in('assignment_id', assignmentIds)
              .order('submitted_at', { ascending: false });
            if (subs) setAllSubmissions(subs.map((s: any) => ({ ...s, student: s.profiles })));
          }
        } else {
          // Student: fetch own submissions
          const { data: subs } = await supabase
            .from('submissions')
            .select('*')
            .eq('user_id', user.id);
          if (subs) {
            const map = new Map<string, Submission>();
            subs.forEach(s => map.set(s.assignment_id, s));
            setSubmissions(map);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [courseId, user]);

  const createAssignment = async () => {
    if (!newTitle.trim() || !user || !courseId) return;
    setCreating(true);
    const { data, error } = await supabase.from('assignments').insert({
      course_id: courseId,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      due_date: newDueDate || null,
      max_score: parseInt(newMaxScore) || 100,
      created_by: user.id,
    }).select('*, courses:course_id(title, subject)').single();

    if (error) { toast.error('Failed to create assignment'); }
    else if (data) {
      setAssignments(prev => [{ ...data, course: (data as any).courses }, ...prev]);
      toast.success('Assignment created!');
      setCreateOpen(false);
      setNewTitle(''); setNewDesc(''); setNewDueDate(''); setNewMaxScore('100');
    }
    setCreating(false);
  };

  const submitAssignment = async (assignmentId: string) => {
    if (!user) { setLoading(false); return; }
    setSubmitting(true);

    let fileUrl: string | null = null;
    if (submitFile) {
      const ext = submitFile.name.split('.').pop();
      const path = `assignments/${user.id}/${assignmentId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(path, submitFile);
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

    if (error) { toast.error('Submission failed'); }
    else if (data) {
      setSubmissions(prev => new Map(prev).set(assignmentId, data));
      toast.success('Assignment submitted!');
      setSubmitOpen(null); setSubmitContent(''); setSubmitFile(null);
    }
    setSubmitting(false);
  };

  const gradeSubmission = async () => {
    if (!gradeOpen) return;
    setGrading(true);
    const { error } = await supabase.from('submissions').update({
      score: parseFloat(gradeScore) || null,
      feedback: gradeFeedback.trim() || null,
      graded_at: new Date().toISOString(),
    }).eq('id', gradeOpen.id);

    if (error) { toast.error('Grading failed'); }
    else {
      setAllSubmissions(prev => prev.map(s =>
        s.id === gradeOpen.id ? { ...s, score: parseFloat(gradeScore), feedback: gradeFeedback, graded_at: new Date().toISOString() } : s
      ));
      toast.success('Grade saved!');
      setGradeOpen(null); setGradeScore(''); setGradeFeedback('');
    }
    setGrading(false);
  };

  const isOverdue = (date: string | null) => date ? new Date(date) < new Date() : false;
  const formatDate = (date: string) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <LogoLoader text="Loading assignments..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/course/${courseId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-primary" /> Assignments
            </h1>
            <p className="text-sm text-muted-foreground">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {isTeacher && (
          <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Assignment</Button>
        )}
      </div>

      {isTeacher ? (
        <Tabs defaultValue="assignments">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({allSubmissions.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="assignments" className="space-y-3 mt-4">
            <AssignmentList assignments={assignments} formatDate={formatDate} isOverdue={isOverdue} />
          </TabsContent>
          <TabsContent value="submissions" className="space-y-3 mt-4">
            {allSubmissions.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground"><p>No submissions yet.</p></CardContent></Card>
            ) : (
              allSubmissions.map(sub => {
                const assignment = assignments.find(a => a.id === sub.assignment_id);
                return (
                  <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setGradeOpen(sub); setGradeScore(sub.score?.toString() || ''); setGradeFeedback(sub.feedback || ''); }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{sub.student?.full_name || 'Student'}</p>
                            <p className="text-xs text-muted-foreground">{assignment?.title} · Submitted {formatDate(sub.submitted_at)}</p>
                          </div>
                          {sub.graded_at ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">
                              <Star className="w-3 h-3 mr-1" />{sub.score}/{assignment?.max_score}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="shrink-0">Pending</Badge>
                          )}
                        </div>
                        {sub.content && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{sub.content}</p>}
                        {sub.file_url && <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-1 inline-block" onClick={e => e.stopPropagation()}>View attachment</a>}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No assignments for this course yet.</p>
            </CardContent></Card>
          ) : (
            assignments.map(a => {
              const sub = submissions.get(a.id);
              const overdue = isOverdue(a.due_date);
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">{a.title}</h3>
                          {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline"><Star className="w-3 h-3 mr-1" />{a.max_score} pts</Badge>
                            {a.due_date && (
                              <Badge variant={overdue ? 'destructive' : 'outline'}>
                                <Clock className="w-3 h-3 mr-1" />{overdue ? 'Overdue' : `Due ${formatDate(a.due_date)}`}
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
                          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Teacher Feedback</p>
                          <p className="text-sm text-foreground">{sub.feedback}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Create Assignment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Title *</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Assignment title" /></div>
            <div><Label>Description</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Instructions..." rows={3} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Due Date</Label><Input type="datetime-local" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} /></div>
              <div><Label>Max Score</Label><Input type="number" value={newMaxScore} onChange={e => setNewMaxScore(e.target.value)} /></div>
            </div>
            <Button className="w-full" onClick={createAssignment} disabled={creating || !newTitle.trim()}>
              {creating ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Grade Dialog */}
      <Dialog open={!!gradeOpen} onOpenChange={() => setGradeOpen(null)}>
        {gradeOpen && (
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Grade Submission</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Student: {gradeOpen.student?.full_name || 'Unknown'}</p>
                {gradeOpen.content && <p className="text-sm text-foreground">{gradeOpen.content}</p>}
                {gradeOpen.file_url && <a href={gradeOpen.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-1 inline-block">View attachment</a>}
              </div>
              <div><Label>Score</Label><Input type="number" value={gradeScore} onChange={e => setGradeScore(e.target.value)} placeholder="Score" /></div>
              <div><Label>Feedback</Label><Textarea value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} placeholder="Feedback for student..." rows={3} /></div>
              <Button className="w-full" onClick={gradeSubmission} disabled={grading}>
                {grading ? 'Saving...' : 'Save Grade'}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

// Extracted sub-component
const AssignmentList = ({ assignments, formatDate, isOverdue }: { assignments: Assignment[]; formatDate: (d: string) => string; isOverdue: (d: string | null) => boolean }) => (
  <>
    {assignments.length === 0 ? (
      <Card><CardContent className="py-8 text-center text-muted-foreground"><p>No assignments created yet.</p></CardContent></Card>
    ) : (
      assignments.map(a => (
        <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground">{a.title}</h3>
              {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline"><Star className="w-3 h-3 mr-1" />{a.max_score} pts</Badge>
                {a.due_date && (
                  <Badge variant={isOverdue(a.due_date) ? 'destructive' : 'outline'}>
                    <Clock className="w-3 h-3 mr-1" />{formatDate(a.due_date)}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))
    )}
  </>
);

export default AssignmentPage;
