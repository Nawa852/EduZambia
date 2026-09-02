import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Play, Pause, Timer, Wand2, Loader2, Check, X, RotateCw, Flag,
  ChevronLeft, ChevronRight, ListChecks, Award, FolderOpen, FileText,
} from 'lucide-react';
import ResourcePicker from '@/components/Resources/ResourcePicker';
import type { RepositoryItem } from '@/lib/resourceRepository';

/* ------------------------------------------------------------------ types */

type QType = 'mcq' | 'true_false' | 'short' | 'long';

interface ExamQuestion {
  id: string;
  section: string;
  type: QType;
  prompt: string;
  points: number;
  options?: string[];
  answer?: string;
}

interface Exam {
  title: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  instructions: string;
  questions: ExamQuestion[];
}

type Phase = 'config' | 'running' | 'paused' | 'review' | 'result';

interface Session {
  exam: Exam;
  answers: Record<string, string>;
  marks: Record<string, number>;
  flagged: string[];
  remaining: number;
  phase: Phase;
  index: number;
}

const SESSION_KEY = 'synapse.exam.session.v1';
/** Other screens (e.g. the Study Room) drop a config here to launch a mock. */
export const EXAM_LAUNCH_KEY = 'synapse.exam.launch';

const SUBJECTS = [
  'Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'Science',
  'Civic Education', 'Geography', 'History', 'Commerce', 'Principles of Accounts',
  'Computer Studies', 'Religious Education', 'Agricultural Science',
];
const GRADES = ['Grade 7', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const LEVELS = ['Easy', 'Standard', 'Challenging', 'Exam standard'];

const fmt = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((n) => String(Math.max(0, n)).padStart(2, '0'))
    .join(':');

const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Normalises whatever shape the model returns into a flat question list. */
function flatten(raw: any): Exam | null {
  if (!raw) return null;
  const sections: any[] = Array.isArray(raw.sections) ? raw.sections : [];
  const questions: ExamQuestion[] = [];
  sections.forEach((sec, si) => {
    (sec.questions ?? []).forEach((q: any, qi: number) => {
      const type: QType = ['mcq', 'true_false', 'short', 'long'].includes(q.type) ? q.type : 'short';
      questions.push({
        id: String(q.id ?? `${si}-${qi}`),
        section: sec.heading || `Section ${si + 1}`,
        type,
        prompt: String(q.prompt ?? '').trim(),
        points: Number(q.points) > 0 ? Number(q.points) : 1,
        options: type === 'true_false' ? ['True', 'False'] : (Array.isArray(q.options) ? q.options.map(String) : undefined),
        answer: q.answer != null ? String(q.answer) : undefined,
      });
    });
  });
  if (!questions.length) return null;
  return {
    title: raw.title || 'Mock exam',
    subject: raw.subject || '',
    grade: raw.grade || '',
    durationMinutes: Number(raw.durationMinutes) > 0 ? Number(raw.durationMinutes) : 60,
    instructions: raw.instructions || 'Answer all questions. Marks are shown for each question.',
    questions,
  };
}

/** True when an objective answer is correct — tolerant of letter or text keys. */
function isObjectiveCorrect(q: ExamQuestion, given: string): boolean {
  if (!given || !q.answer) return false;
  const key = q.answer.trim().toLowerCase();
  const ans = given.trim().toLowerCase();
  if (key === ans) return true;
  const idx = (q.options ?? []).findIndex((o) => o.trim().toLowerCase() === ans);
  if (idx >= 0) {
    if (key === letters[idx].toLowerCase()) return true;
    if (key === String(idx)) return true;
    if (key.startsWith(`${letters[idx].toLowerCase()}.`) || key.startsWith(`${letters[idx].toLowerCase()})`)) return true;
  }
  return false;
}

/* ------------------------------------------------------------------- page */

const ECZExamSimulatorPage: React.FC = () => {
  const [subject, setSubject] = useState('Mathematics');
  const [grade, setGrade] = useState('Grade 12');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Exam standard');
  const [count, setCount] = useState(15);
  const [duration, setDuration] = useState(60);
  const [timed, setTimed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  /* restore an unfinished paper */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Session;
        if (s?.exam?.questions?.length) setSession({ ...s, phase: s.phase === 'running' ? 'paused' : s.phase });
      }
    } catch { /* ignore */ }
  }, []);

  /* accept a launch config from the Study Room */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(EXAM_LAUNCH_KEY);
      if (!raw) return;
      sessionStorage.removeItem(EXAM_LAUNCH_KEY);
      const cfg = JSON.parse(raw);
      if (cfg.subject) setSubject(cfg.subject);
      if (cfg.grade) setGrade(cfg.grade);
      if (cfg.topic) setTopic(cfg.topic);
      toast.info('Exam settings loaded from your study pack — press Generate.');
    } catch { /* ignore */ }
  }, []);

  /* persist */
  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  /* timer */
  useEffect(() => {
    if (tick.current) clearInterval(tick.current);
    if (session?.phase !== 'running') return;
    tick.current = setInterval(() => {
      setSession((s) => {
        if (!s || s.phase !== 'running') return s;
        if (s.remaining <= 1) {
          toast.warning('Time is up — your paper was submitted.');
          return { ...s, remaining: 0, phase: 'review' };
        }
        return { ...s, remaining: s.remaining - 1 };
      });
    }, 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [session?.phase]);

  const generate = useCallback(async (extraTopic?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-test-generator', {
        body: {
          subject,
          grade,
          topic: extraTopic ?? topic,
          durationMinutes: duration,
          numQuestions: count,
          level,
          includeCharts: false,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const exam = flatten(data?.test);
      if (!exam) throw new Error('The generator returned no questions — try again.');
      exam.durationMinutes = duration;
      setSession({
        exam,
        answers: {},
        marks: {},
        flagged: [],
        remaining: timed ? duration * 60 : 0,
        phase: 'running',
        index: 0,
      });
      toast.success(`${exam.questions.length} questions ready.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not generate the paper');
    } finally {
      setLoading(false);
    }
  }, [subject, grade, topic, duration, count, level, timed]);

  const fromLibrary = (items: RepositoryItem[]) => {
    const item = items[0];
    if (!item) return;
    setTopic(item.title);
    if (item.subject) setSubject(item.subject);
    toast.success(`Topic set from "${item.title}"`);
  };

  /* -------------------------------------------------------------- config */

  if (!session) {
    return (
      <div className="space-y-5">
        <header className="space-y-1">
          <p className="text-[13px] font-medium text-primary">Exam simulator</p>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Build the exact paper you want</h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Choose the subject, topic, length and difficulty. Synapse writes real questions, times you,
            lets you pause, then marks the paper with a full answer key.
          </p>
        </header>

        <Card className="p-5 sm:p-6 rounded-[22px] border-border/60 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] text-muted-foreground">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] text-muted-foreground">Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] text-muted-foreground">Topic focus (optional)</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Quadratic equations, photosynthesis, the 1964 independence"
              className="rounded-xl h-11"
            />
            <Button variant="outline" onClick={() => setPickerOpen(true)} className="w-full rounded-xl h-10 gap-2 mt-1">
              <FolderOpen className="w-4 h-4" /> Use a file from my library as the topic
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] text-muted-foreground">Difficulty</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Questions</span><span className="font-medium">{count}</span>
              </div>
              <Slider value={[count]} min={5} max={40} step={1} onValueChange={([v]) => setCount(v)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Duration</span><span className="font-medium">{duration} min</span>
              </div>
              <Slider value={[duration]} min={10} max={180} step={5} onValueChange={([v]) => setDuration(v)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Timed paper</p>
              <p className="text-xs text-muted-foreground">Off = practise mode, no clock.</p>
            </div>
            <Switch checked={timed} onCheckedChange={setTimed} />
          </div>

          <Button onClick={() => generate()} disabled={loading} size="lg" className="w-full rounded-xl h-12">
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Writing your paper…</>
              : <><Wand2 className="w-4 h-4 mr-2" /> Generate paper</>}
          </Button>
        </Card>

        <ResourcePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          multiple={false}
          title="Pick a paper or note"
          onSelect={(items) => fromLibrary(items as RepositoryItem[])}
        />
      </div>
    );
  }

  return (
    <ExamRunner
      session={session}
      setSession={setSession}
      onExit={() => setSession(null)}
      timed={timed}
    />
  );
};

/* ---------------------------------------------------------------- runner */

const ExamRunner: React.FC<{
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  onExit: () => void;
  timed: boolean;
}> = ({ session, setSession, onExit, timed }) => {
  const { exam, answers, marks, flagged, phase, index } = session;
  const q = exam.questions[index];
  const answered = Object.keys(answers).filter((k) => answers[k]?.trim()).length;

  const totalPoints = useMemo(
    () => exam.questions.reduce((s, x) => s + x.points, 0),
    [exam.questions],
  );

  const objectiveScore = useMemo(
    () => exam.questions.reduce(
      (s, x) => s + ((x.type === 'mcq' || x.type === 'true_false') && isObjectiveCorrect(x, answers[x.id] ?? '') ? x.points : 0),
      0,
    ),
    [exam.questions, answers],
  );

  const writtenScore = useMemo(
    () => exam.questions.reduce(
      (s, x) => s + ((x.type === 'short' || x.type === 'long') ? (marks[x.id] ?? 0) : 0),
      0,
    ),
    [exam.questions, marks],
  );

  const earned = objectiveScore + writtenScore;
  const percent = totalPoints ? Math.round((earned / totalPoints) * 100) : 0;
  const letterGrade = percent >= 80 ? 'Distinction' : percent >= 65 ? 'Merit' : percent >= 50 ? 'Credit' : percent >= 40 ? 'Pass' : 'Fail';

  const patch = (p: Partial<Session>) => setSession((s) => (s ? { ...s, ...p } : s));

  const submit = () => {
    if (answered < exam.questions.length && !window.confirm(`You have answered ${answered} of ${exam.questions.length}. Submit anyway?`)) return;
    patch({ phase: 'review' });
  };

  const finish = async () => {
    patch({ phase: 'result' });
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id;
      if (!uid) return;
      const objectives = exam.questions.filter((x) => x.type === 'mcq' || x.type === 'true_false');
      await supabase.from('quiz_attempts').insert({
        user_id: uid,
        subject: exam.subject || 'Mock exam',
        grade_level: exam.grade || 'General',
        total_questions: exam.questions.length,
        correct_answers: objectives.filter((x) => isObjectiveCorrect(x, answers[x.id] ?? '')).length,
        time_taken_seconds: timed ? Math.max(0, exam.durationMinutes * 60 - session.remaining) : null,
      });
    } catch { /* attempt logging is best-effort */ }
  };

  /* ------------------------------------------------------------- result */

  if (phase === 'result') {
    return (
      <div className="space-y-5">
        <Card className="p-8 rounded-[22px] text-center space-y-3 border-border/60">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-semibold">{earned} / {totalPoints}</h2>
          <p className="text-muted-foreground">{percent}% — {letterGrade}</p>
          <Progress value={percent} className="h-2 max-w-sm mx-auto" />
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => patch({ phase: 'review' })}>
              <ListChecks className="w-4 h-4 mr-2" /> See the answer key
            </Button>
            <Button className="rounded-xl" onClick={onExit}>
              <RotateCw className="w-4 h-4 mr-2" /> New paper
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------- review */

  if (phase === 'review') {
    return (
      <div className="space-y-4">
        <Card className="p-5 rounded-[22px] border-border/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Marking — {exam.title}</h2>
            <p className="text-sm text-muted-foreground">
              Objective questions are marked automatically. Award yourself marks on written answers using the key.
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold">{earned}/{totalPoints}</p>
            <p className="text-xs text-muted-foreground">{percent}%</p>
          </div>
        </Card>

        {exam.questions.map((x, i) => {
          const given = answers[x.id] ?? '';
          const objective = x.type === 'mcq' || x.type === 'true_false';
          const correct = objective && isObjectiveCorrect(x, given);
          return (
            <Card key={x.id} className="p-5 rounded-[22px] border-border/60 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-sm">{i + 1}. {x.prompt}</p>
                <Badge variant="outline" className="rounded-full shrink-0">{x.points} mk</Badge>
              </div>

              {objective ? (
                <div className={`text-sm rounded-xl p-3 flex items-start gap-2 ${correct ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {correct ? <Check className="w-4 h-4 text-emerald-600 mt-0.5" /> : <X className="w-4 h-4 text-red-600 mt-0.5" />}
                  <div>
                    <p>Your answer: <span className="font-medium">{given || '— blank —'}</span></p>
                    {!correct && <p className="text-muted-foreground">Correct: {x.answer}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm rounded-xl bg-muted/60 p-3 whitespace-pre-wrap">{given || '— blank —'}</div>
                  {x.answer && (
                    <div className="text-sm rounded-xl border border-border/60 p-3">
                      <span className="font-medium">Model answer / rubric: </span>{x.answer}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Award marks:</span>
                    {Array.from({ length: x.points + 1 }, (_, m) => (
                      <Button
                        key={m}
                        size="sm"
                        variant={(marks[x.id] ?? -1) === m ? 'default' : 'outline'}
                        className="rounded-lg h-7 px-2.5"
                        onClick={() => patch({ marks: { ...marks, [x.id]: m } })}
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        <div className="flex gap-2 pb-4">
          <Button variant="outline" className="rounded-xl flex-1" onClick={onExit}>Discard</Button>
          <Button className="rounded-xl flex-1" onClick={finish}>Finish &amp; save result</Button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------- sitting paper */

  return (
    <div className="space-y-4">
      <Card className="p-4 rounded-[22px] border-border/60 sticky top-2 z-10 backdrop-blur-md bg-card/85">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{exam.title}</p>
            <p className="text-xs text-muted-foreground truncate">{q.section} · {answered}/{exam.questions.length} answered</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {timed && (
              <span className={`font-mono text-sm px-2.5 py-1 rounded-lg ${session.remaining < 120 ? 'bg-red-500/10 text-red-600' : 'bg-muted'}`}>
                <Timer className="w-3.5 h-3.5 inline mr-1" />{fmt(session.remaining)}
              </span>
            )}
            {timed && (
              <Button size="sm" variant="outline" className="rounded-xl"
                onClick={() => patch({ phase: phase === 'running' ? 'paused' : 'running' })}>
                {phase === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
        <Progress value={(answered / exam.questions.length) * 100} className="h-1.5 mt-3" />
      </Card>

      {phase === 'paused' ? (
        <Card className="p-10 rounded-[22px] text-center space-y-3 border-border/60">
          <Pause className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Paper paused</p>
          <p className="text-sm text-muted-foreground">Your answers and the clock are saved — even if you close the app.</p>
          <Button className="rounded-xl" onClick={() => patch({ phase: 'running' })}>
            <Play className="w-4 h-4 mr-2" /> Resume
          </Button>
        </Card>
      ) : (
        <>
          <Card className="p-5 sm:p-6 rounded-[22px] border-border/60 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] font-medium">{index + 1}. {q.prompt}</p>
              <Badge variant="outline" className="rounded-full shrink-0">{q.points} mk</Badge>
            </div>

            {q.options?.length ? (
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={oi}
                      onClick={() => patch({ answers: { ...answers, [q.id]: opt } })}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${
                        selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="font-medium mr-2">{letters[oi]}.</span>{opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Textarea
                rows={q.type === 'long' ? 10 : 4}
                value={answers[q.id] ?? ''}
                onChange={(e) => patch({ answers: { ...answers, [q.id]: e.target.value } })}
                placeholder="Write your answer…"
                className="rounded-xl resize-none"
              />
            )}

            <div className="flex items-center justify-between pt-1">
              <Button
                size="sm" variant="ghost"
                className={`rounded-xl ${flagged.includes(q.id) ? 'text-amber-600' : 'text-muted-foreground'}`}
                onClick={() => patch({
                  flagged: flagged.includes(q.id) ? flagged.filter((f) => f !== q.id) : [...flagged, q.id],
                })}
              >
                <Flag className="w-4 h-4 mr-1.5" /> {flagged.includes(q.id) ? 'Flagged' : 'Flag for review'}
              </Button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-xl" disabled={index === 0}
                  onClick={() => patch({ index: index - 1 })}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" disabled={index === exam.questions.length - 1}
                  onClick={() => patch({ index: index + 1 })}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-[22px] border-border/60">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Question navigator</p>
            <div className="flex flex-wrap gap-1.5">
              {exam.questions.map((x, i) => (
                <button
                  key={x.id}
                  onClick={() => patch({ index: i })}
                  className={`w-8 h-8 rounded-lg text-xs font-medium border transition-colors ${
                    i === index ? 'border-primary bg-primary text-primary-foreground'
                      : flagged.includes(x.id) ? 'border-amber-500 text-amber-600'
                      : answers[x.id]?.trim() ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </Card>

          <div className="flex gap-2 pb-4">
            <Button variant="outline" className="rounded-xl flex-1" onClick={() => { if (window.confirm('Leave this paper? Progress is kept until you start a new one.')) onExit(); }}>
              Leave
            </Button>
            <Button className="rounded-xl flex-1" onClick={submit}>Submit paper</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ECZExamSimulatorPage;
