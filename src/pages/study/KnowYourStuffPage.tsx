import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  UploadCloud, Sparkles, ListChecks, Layers, Target, FileText, Loader2,
  Boxes, RotateCcw, Save, CheckCircle2, ChevronRight, Lightbulb,
} from 'lucide-react';
import PageContainer from '@/components/Layout/PageContainer';
import { segmentedBarClass, segmentedTriggerClass } from '@/components/UI/SegmentedTabs';
import { ArtifactCanvas, type Artifact } from '@/components/AI/ArtifactCanvas';
import { saveProgress, loadProgress } from '@/lib/progress';
import { MAX_TIMEOUT, withTimeout } from '@/lib/withTimeout';

type Tab = 'points' | 'cards' | 'quiz' | 'visual';

interface Pack {
  title?: string;
  subject?: string;
  level?: string;
  summary?: string;
  keyPoints?: string[];
  flashcards?: { q: string; a: string }[];
  quiz?: { question: string; options: string[]; correct: number; explanation?: string }[];
  studyPlan?: { day: number; focus: string; tasks: string[] }[];
}

const STAGES = [
  'Reading your material',
  'Pulling out the key points',
  'Writing flashcards',
  'Building a quiz',
  'Finishing up',
];

const REF_KEY = 'know-your-stuff:latest';

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const KnowYourStuffPage: React.FC = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [pack, setPack] = useState<Pack | null>(null);
  const [tab, setTab] = useState<Tab>('points');
  const [flipped, setFlipped] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [artifactBusy, setArtifactBusy] = useState(false);
  const dropRef = useRef<HTMLLabelElement>(null);
  const [dragging, setDragging] = useState(false);

  /* Restore the last pack so nothing is ever lost. */
  useEffect(() => {
    if (!user) return;
    loadProgress<{ pack: Pack; artifact: Artifact | null }>('study_pack', REF_KEY).then((snap) => {
      if (snap?.payload?.pack) {
        setPack(snap.payload.pack);
        setArtifact(snap.payload.artifact ?? null);
      }
    });
  }, [user?.id]);

  const persist = useCallback((p: Pack, a: Artifact | null) => {
    saveProgress({
      kind: 'study_pack',
      refKey: REF_KEY,
      title: p.title || 'Know Your Stuff pack',
      payload: { pack: p, artifact: a },
      progress: 100,
    }).catch(() => undefined);
  }, []);

  const breakdown = async () => {
    if (!topic.trim() && !text.trim() && !file) {
      toast.error('Add a topic, paste notes, or drop a file first');
      return;
    }
    setBusy(true);
    setStage(0);
    setPack(null);
    setArtifact(null);
    const ticker = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1400);
    try {
      const body: Record<string, unknown> = { topic: topic.trim() || undefined, text: text.trim() || undefined };
      if (file) {
        body.file = await fileToBase64(file);
        body.filename = file.name;
        body.mimeType = file.type || 'application/octet-stream';
      }
      const { data, error } = await withTimeout(
        supabase.functions.invoke('ai-study-kit', { body }),
        45000,
      );
      if (error) throw error;
      const result = data as Pack;
      if (!result || (result as any).error) throw new Error((result as any)?.error || 'No pack returned');
      setPack(result);
      setTab('points');
      persist(result, null);
      toast.success('Broken down — everything is saved');
    } catch (e) {
      toast.error((e as Error).message || 'Could not break that down. Try again.');
    } finally {
      clearInterval(ticker);
      setBusy(false);
    }
  };

  const makeVisual = async () => {
    if (!pack) return;
    setArtifactBusy(true);
    setTab('visual');
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('ai-artifact', {
          body: {
            prompt: `Build an interactive visual lesson for "${pack.title || topic}". Cover these ideas: ${(pack.keyPoints || []).slice(0, 8).join('; ')}`,
            kind: 'auto',
            context: (pack.summary || '').slice(0, 3000),
          },
        }),
        60000,
      );
      if (error) throw error;
      const a = data as Artifact;
      if (!a?.code) throw new Error('No visual returned');
      setArtifact(a);
      persist(pack, a);
    } catch (e) {
      toast.error((e as Error).message || 'Visual generation failed');
    } finally {
      setArtifactBusy(false);
    }
  };

  const reset = () => {
    setPack(null);
    setArtifact(null);
    setAnswers({});
    setFlipped(null);
  };

  const quiz = pack?.quiz ?? [];
  const answered = Object.keys(answers).length;
  const correct = quiz.filter((q, i) => answers[i] === q.correct).length;

  /* ------------------------------ input state ------------------------------ */
  if (!pack) {
    return (
      <PageContainer className="py-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Know Your Stuff</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Drop anything you're studying — notes, a past paper, a slide deck, a photo of the board.
            Synapse breaks it down into key points, flashcards, a quiz and an interactive visual in seconds.
          </p>
        </div>

        <Card className="rounded-3xl border-border/50 p-4 sm:p-6 space-y-4">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What are you studying? e.g. Photosynthesis, Grade 10 Biology"
            className="rounded-xl h-11"
            aria-label="Topic"
          />

          <label
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 px-4 cursor-pointer transition-colors ${
              dragging ? 'border-primary bg-primary/5' : 'border-border/70 hover:border-primary/50 hover:bg-secondary/40'
            }`}
          >
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.pptx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <UploadCloud className="w-7 h-7 text-primary" />
            <p className="text-sm font-medium text-foreground">
              {file ? file.name : 'Drop a file or tap to browse'}
            </p>
            <p className="text-[11px] text-muted-foreground">PDF, Word, slides, images or plain text</p>
          </label>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="…or paste your notes here"
            className="rounded-xl"
          />

          <Button className="w-full rounded-xl h-11" onClick={breakdown} disabled={busy}>
            {busy
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{STAGES[stage]}…</>
              : <><Sparkles className="w-4 h-4 mr-2" />Break it down</>}
          </Button>

          {busy && <Progress value={((stage + 1) / STAGES.length) * 100} className="h-1.5" />}
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { icon: ListChecks, label: 'Key points', desc: 'The 10 things that matter' },
            { icon: Layers, label: 'Flashcards', desc: 'Ready to revise' },
            { icon: Target, label: 'Quiz', desc: 'Instant feedback' },
            { icon: Boxes, label: 'Visual lesson', desc: 'Built with live code' },
          ].map((f) => (
            <Card key={f.label} className="rounded-2xl p-3.5 border-border/40">
              <f.icon className="w-4 h-4 text-primary mb-2" />
              <p className="text-[13px] font-semibold text-foreground leading-tight">{f.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{f.desc}</p>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  /* ------------------------------ results state ---------------------------- */
  return (
    <PageContainer className="py-1">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
            {pack.title || 'Your breakdown'}
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {pack.subject && <Badge variant="secondary" className="rounded-full text-[10px]">{pack.subject}</Badge>}
            {pack.level && <Badge variant="outline" className="rounded-full text-[10px]">{pack.level}</Badge>}
            <Badge className="rounded-full text-[10px] bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">
              <Save className="w-3 h-3 mr-1" />Saved
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={reset}>
          <RotateCcw className="w-4 h-4 mr-1.5" />New
        </Button>
      </div>

      <div className={segmentedBarClass}>
        {([
          ['summary', 'Summary', Lightbulb],
          ['points', 'Key points', ListChecks],
          ['cards', 'Flashcards', Layers],
          ['quiz', 'Quiz', Target],
          ['plan', 'Study plan', FileText],
          ['visual', 'Visual', Boxes],
        ] as [Tab, string, typeof ListChecks][]).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={segmentedTriggerClass(tab === id)}
          >
            <Icon className="w-3.5 h-3.5 mr-1.5 inline-block" />{label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <Card className="rounded-2xl p-4 border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">The short version</p>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {pack.summary || 'No summary was produced for this material.'}
          </p>
        </Card>
      )}

      {tab === 'points' && (
        <div className="grid gap-2 md:grid-cols-2">
          {(pack.keyPoints ?? []).map((p, i) => (
            <Card key={i} className="rounded-2xl p-3.5 border-border/40 flex gap-3">
              <span className="w-6 h-6 shrink-0 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-foreground leading-snug">{p}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'plan' && (
        <Card className="rounded-2xl p-4 border-border/50">
          <p className="text-sm font-semibold text-foreground mb-2.5">Your study plan</p>
          {pack.studyPlan?.length ? (
            <div className="space-y-2">
              {pack.studyPlan.map((d) => (
                <div key={d.day} className="flex gap-3">
                  <Badge variant="secondary" className="rounded-full text-[10px] h-fit shrink-0">Day {d.day}</Badge>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{d.focus}</p>
                    <p className="text-[11px] text-muted-foreground">{d.tasks?.join(' · ')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No plan was produced for this material.</p>
          )}
        </Card>
      )}


      {tab === 'cards' && (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {(pack.flashcards ?? []).map((c, i) => (
            <button
              key={i}
              onClick={() => setFlipped(flipped === i ? null : i)}
              className="text-left"
              aria-label={`Flashcard ${i + 1}`}
            >
              <Card className={`rounded-2xl p-4 min-h-[130px] border transition-colors ${
                flipped === i ? 'bg-primary/5 border-primary/40' : 'border-border/40 hover:border-primary/30'
              }`}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
                  {flipped === i ? 'Answer' : `Card ${i + 1}`}
                </p>
                <p className="text-sm text-foreground leading-snug">{flipped === i ? c.a : c.q}</p>
                {flipped !== i && (
                  <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                    Tap to reveal <ChevronRight className="w-3 h-3" />
                  </p>
                )}
              </Card>
            </button>
          ))}
        </div>
      )}

      {tab === 'quiz' && (
        <div className="space-y-3">
          {answered > 0 && (
            <Card className="rounded-2xl p-3.5 border-border/50 flex items-center justify-between">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{correct}</span> / {answered} correct
              </p>
              <Progress value={(answered / Math.max(quiz.length, 1)) * 100} className="h-1.5 w-32" />
            </Card>
          )}
          {quiz.map((q, i) => {
            const picked = answers[i];
            return (
              <Card key={i} className="rounded-2xl p-4 border-border/40 space-y-2.5">
                <p className="text-sm font-medium text-foreground">{i + 1}. {q.question}</p>
                <div className="grid gap-1.5">
                  {q.options.map((o, oi) => {
                    const isPicked = picked === oi;
                    const isCorrect = q.correct === oi;
                    const show = picked !== undefined;
                    return (
                      <button
                        key={oi}
                        disabled={show}
                        onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                        className={`text-left text-[13px] rounded-xl px-3 py-2 border transition-colors ${
                          show && isCorrect
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : show && isPicked
                              ? 'border-destructive/50 bg-destructive/10 text-destructive'
                              : 'border-border/50 hover:border-primary/40 text-foreground'
                        }`}
                      >
                        {show && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 inline-block" />}
                        {o}
                      </button>
                    );
                  })}
                </div>
                {picked !== undefined && q.explanation && (
                  <p className="text-[12px] text-muted-foreground leading-snug">{q.explanation}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'visual' && (
        <div className="space-y-3">
          {artifact ? (
            <ArtifactCanvas artifact={artifact} onRegenerate={makeVisual} />
          ) : (
            <Card className="rounded-3xl border-dashed p-10 text-center space-y-3">
              <Boxes className="w-9 h-9 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">Turn this into an interactive lesson</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Synapse writes the code live and renders a 3D scene, diagram or chart you can explore.
              </p>
              <Button className="rounded-xl" onClick={makeVisual} disabled={artifactBusy}>
                {artifactBusy
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Writing code…</>
                  : <><Sparkles className="w-4 h-4 mr-2" />Generate visual</>}
              </Button>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default KnowYourStuffPage;
