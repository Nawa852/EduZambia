import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ClipboardCheck, Clock, User, Sparkles, Loader2, Send, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface QueueItem {
  id: string;
  studentId: string;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  submittedAt: string;
  content: string | null;
  fileUrl: string | null;
  maxScore: number;
}

interface Insight {
  score?: number;
  max?: number;
  strengths?: string[];
  improvements?: string[];
  feedback?: string;
  suggested_grade_letter?: string;
}

const daysOld = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

export const TeacherGradingQueue: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [sort, setSort] = useState<'oldest' | 'newest'>('oldest');
  const [active, setActive] = useState<QueueItem | null>(null);

  const [insight, setInsight] = useState<Insight | null>(null);
  const [thinking, setThinking] = useState(false);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: courses } = await supabase.from('courses').select('id, title').eq('created_by', user.id);
      if (!courses?.length) { setItems([]); return; }
      const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

      const { data: assignments } = await supabase
        .from('assignments').select('id, title, course_id, max_score')
        .in('course_id', courses.map((c) => c.id));
      if (!assignments?.length) { setItems([]); return; }
      const aMap = Object.fromEntries(assignments.map((a) => [a.id, a]));

      const { data: subs } = await supabase
        .from('submissions')
        .select('id, assignment_id, user_id, submitted_at, content, file_url')
        .in('assignment_id', assignments.map((a) => a.id))
        .is('graded_at', null)
        .order('submitted_at', { ascending: true })
        .limit(200);
      if (!subs?.length) { setItems([]); return; }

      const { data: profiles } = await supabase
        .from('profiles').select('id, full_name')
        .in('id', [...new Set(subs.map((s) => s.user_id))]);
      const pMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || 'Student']));

      setItems(subs.map((s) => {
        const a = aMap[s.assignment_id];
        return {
          id: s.id,
          studentId: s.user_id,
          studentName: pMap[s.user_id] || 'Student',
          assignmentId: s.assignment_id,
          assignmentTitle: a?.title ?? 'Assignment',
          courseId: a?.course_id ?? '',
          courseTitle: courseMap[a?.course_id ?? ''] ?? 'Class',
          submittedAt: s.submitted_at,
          content: s.content,
          fileUrl: s.file_url,
          maxScore: Number(a?.max_score ?? 100),
        };
      }));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((i) => map.set(i.courseId, i.courseTitle));
    return [...map.entries()];
  }, [items]);

  const byClass = useMemo(() => {
    const map = new Map<string, { title: string; count: number; oldest: number }>();
    items.forEach((i) => {
      const cur = map.get(i.courseId) ?? { title: i.courseTitle, count: 0, oldest: 0 };
      cur.count += 1;
      cur.oldest = Math.max(cur.oldest, daysOld(i.submittedAt));
      map.set(i.courseId, cur);
    });
    return [...map.entries()];
  }, [items]);

  const visible = useMemo(() => {
    let out = items;
    if (courseFilter !== 'all') out = out.filter((i) => i.courseId === courseFilter);
    if (ageFilter === 'overdue') out = out.filter((i) => daysOld(i.submittedAt) >= 3);
    if (ageFilter === 'today') out = out.filter((i) => daysOld(i.submittedAt) === 0);
    return [...out].sort((a, b) =>
      sort === 'oldest'
        ? +new Date(a.submittedAt) - +new Date(b.submittedAt)
        : +new Date(b.submittedAt) - +new Date(a.submittedAt));
  }, [items, courseFilter, ageFilter, sort]);

  const openItem = (item: QueueItem) => {
    setActive(item);
    setInsight(null);
    setScore('');
    setFeedback('');
  };

  const runBreakdown = async () => {
    if (!active) return;
    if (!active.content) return toast.error('This submission has no text to analyse');
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-grade-assist', {
        body: {
          submission: active.content,
          maxScore: active.maxScore,
          subject: active.courseTitle,
          rubric: `Assignment: ${active.assignmentTitle}`,
        },
      });
      if (error) throw error;
      const parsed: Insight = typeof data === 'string' ? JSON.parse(data) : (data?.result ?? data);
      setInsight(parsed);
      if (parsed?.score != null) setScore(String(parsed.score));
      if (parsed?.feedback) setFeedback(parsed.feedback);
    } catch (e) {
      toast.error('Could not generate the breakdown. Grade manually below.');
    } finally {
      setThinking(false);
    }
  };

  const release = async () => {
    if (!active) return;
    const numeric = Number(score);
    if (!score || Number.isNaN(numeric)) return toast.error('Enter a score');
    setSaving(true);
    const { error } = await supabase
      .from('submissions')
      .update({ score: numeric, feedback, graded_at: new Date().toISOString() })
      .eq('id', active.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Released to ${active.studentName}`);
    setItems((p) => p.filter((i) => i.id !== active.id));
    const next = visible.find((i) => i.id !== active.id);
    if (next) openItem(next); else setActive(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Waiting to be marked</p>
            <p className="text-3xl font-semibold tracking-tight">{items.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Classes affected</p>
            <p className="text-3xl font-semibold tracking-tight">{byClass.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Waiting 3+ days</p>
            <p className="text-3xl font-semibold tracking-tight text-destructive">
              {items.filter((i) => daysOld(i.submittedAt) >= 3).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {byClass.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {byClass.map(([id, info]) => (
            <button
              key={id}
              onClick={() => setCourseFilter(courseFilter === id ? 'all' : id)}
              className={`shrink-0 text-left rounded-2xl border px-4 py-3 transition-colors ${
                courseFilter === id ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-muted/50'
              }`}
            >
              <p className="text-sm font-medium">{info.title}</p>
              <p className="text-xs text-muted-foreground">
                {info.count} ungraded · oldest {info.oldest}d
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[190px] rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {courses.map(([id, title]) => <SelectItem key={id} value={id}>{title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ageFilter} onValueChange={setAgeFilter}>
          <SelectTrigger className="w-[160px] rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="overdue">Waiting 3+ days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as 'oldest' | 'newest')}>
          <SelectTrigger className="w-[150px] rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="newest">Newest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center space-y-2">
            <ClipboardCheck className="w-10 h-10 mx-auto text-muted-foreground/60" />
            <h3 className="font-semibold">All caught up</h3>
            <p className="text-sm text-muted-foreground">Nothing is waiting to be marked here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((item) => {
            const age = daysOld(item.submittedAt);
            return (
              <button
                key={item.id}
                onClick={() => openItem(item)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.studentName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.assignmentTitle} · {item.courseTitle}
                  </p>
                </div>
                {age >= 3 && <Badge variant="destructive" className="rounded-full text-[10px]">{age}d</Badge>}
                <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {active && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>{active.studentName}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {active.assignmentTitle} · {active.courseTitle} · out of {active.maxScore}
                </p>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                <Card className="rounded-2xl">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Submission</p>
                    <p className="text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {active.content || 'No written answer supplied.'}
                    </p>
                    {active.fileUrl && (
                      <a href={active.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline mt-3 inline-block">
                        Open attached file
                      </a>
                    )}
                  </CardContent>
                </Card>

                <Button onClick={runBreakdown} disabled={thinking} variant="secondary" className="w-full rounded-xl gap-2">
                  {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {thinking ? 'Reading the work…' : 'Get breakdown insights'}
                </Button>

                {insight && (
                  <Card className="rounded-2xl border-primary/30 bg-primary/5">
                    <CardContent className="p-4 space-y-3 text-sm">
                      {insight.score != null && (
                        <p className="font-medium">
                          Suggested: {insight.score}/{insight.max ?? active.maxScore}
                          {insight.suggested_grade_letter ? ` (${insight.suggested_grade_letter})` : ''}
                        </p>
                      )}
                      {!!insight.strengths?.length && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Strengths</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {insight.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {!!insight.improvements?.length && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">To improve</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {insight.improvements.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Score (out of {active.maxScore})</label>
                    <Input
                      type="number" min={0} max={active.maxScore} value={score}
                      onChange={(e) => setScore(e.target.value)} className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Feedback for the student</label>
                    <Textarea rows={5} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="rounded-xl" />
                  </div>
                  <Button onClick={release} disabled={saving} className="w-full rounded-xl gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Release mark & notify
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TeacherGradingQueue;
