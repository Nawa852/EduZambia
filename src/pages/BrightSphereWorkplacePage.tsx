import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles, Send, Loader2, Mic, MicOff, Paperclip, Camera, Brain, Compass,
  Calculator, Target, ClipboardCheck, PenTool, NotebookPen, CalendarClock,
  ArrowRight, RotateCcw, Check, X,
} from 'lucide-react';

/* ------------------------------------------------------------------ types */

type Capability =
  | 'explain' | 'guide' | 'solve' | 'practise'
  | 'assess' | 'create' | 'organise' | 'plan';

interface Flashcard { q: string; a: string }
interface QuizItem { question: string; options: string[]; correct: number; explanation?: string }
interface PlanDay { day: number; focus: string; tasks: string[] }

interface Reply {
  capability?: Capability;
  message?: string;
  keyPoints?: string[];
  flashcards?: Flashcard[];
  quiz?: QuizItem[];
  plan?: PlanDay[];
  mindmap?: string;
  evidence?: { understood?: string[]; gaps?: string[] };
  nextAction?: { label: string; capability?: Capability; prompt: string };
}

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment?: string;
  reply?: Reply;
}

const CAPABILITIES: { id: Capability; label: string; icon: React.ElementType; tint: string }[] = [
  { id: 'explain',  label: 'Explain',  icon: Brain,          tint: 'text-sky-600 bg-sky-500/10' },
  { id: 'guide',    label: 'Guide',    icon: Compass,        tint: 'text-violet-600 bg-violet-500/10' },
  { id: 'solve',    label: 'Solve',    icon: Calculator,     tint: 'text-emerald-600 bg-emerald-500/10' },
  { id: 'practise', label: 'Practise', icon: Target,         tint: 'text-amber-600 bg-amber-500/10' },
  { id: 'assess',   label: 'Assess',   icon: ClipboardCheck, tint: 'text-rose-600 bg-rose-500/10' },
  { id: 'create',   label: 'Create',   icon: PenTool,        tint: 'text-fuchsia-600 bg-fuchsia-500/10' },
  { id: 'organise', label: 'Organise', icon: NotebookPen,    tint: 'text-teal-600 bg-teal-500/10' },
  { id: 'plan',     label: 'Plan',     icon: CalendarClock,  tint: 'text-indigo-600 bg-indigo-500/10' },
];

const capMeta = (c?: Capability) => CAPABILITIES.find((x) => x.id === c) ?? CAPABILITIES[0];

const STARTERS = [
  'Explain photosynthesis the way my Grade 10 exam will ask it',
  'I keep failing quadratic equations — find out why and fix it',
  'Give me 5 practice questions on the Zambian economy, then mark me',
  'Turn my last topic into notes and flashcards I can revise tonight',
];

/* ------------------------------------------------------------ small parts */

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-3">
    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
    {children}
  </div>
);

const FlashcardDeck: React.FC<{ cards: Flashcard[] }> = ({ cards }) => {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i];
  if (!card) return null;
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
      <button
        onClick={() => setFlipped((f) => !f)}
        className="min-h-[92px] w-full text-left text-sm leading-relaxed"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {flipped ? 'Answer' : 'Question'}
        </span>
        <div className="mt-1">{flipped ? card.a : card.q}</div>
      </button>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{i + 1} / {cards.length}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setFlipped(false); setI((v) => Math.max(0, v - 1)); }}>Back</Button>
          <Button size="sm" variant="outline" onClick={() => setFlipped((f) => !f)}>Flip</Button>
          <Button size="sm" variant="ghost" onClick={() => { setFlipped(false); setI((v) => Math.min(cards.length - 1, v + 1)); }}>Next</Button>
        </div>
      </div>
    </div>
  );
};

const QuizBlock: React.FC<{ items: QuizItem[]; onResult: (summary: string) => void }> = ({ items, onResult }) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = items.reduce((n, q, idx) => (answers[idx] === q.correct ? n + 1 : n), 0);

  return (
    <div className="space-y-3">
      {items.map((q, idx) => (
        <div key={idx} className="rounded-2xl border border-border/60 p-3">
          <div className="text-sm font-medium">{idx + 1}. {q.question}</div>
          <div className="mt-2 grid gap-1.5">
            {q.options.map((o, oi) => {
              const picked = answers[idx] === oi;
              const right = submitted && oi === q.correct;
              const wrong = submitted && picked && oi !== q.correct;
              return (
                <button
                  key={oi}
                  disabled={submitted}
                  onClick={() => setAnswers((a) => ({ ...a, [idx]: oi }))}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition',
                    right ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : wrong ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                      : picked ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted',
                  )}
                >
                  {right ? <Check className="h-3.5 w-3.5" /> : wrong ? <X className="h-3.5 w-3.5" /> : null}
                  {o}
                </button>
              );
            })}
          </div>
          {submitted && q.explanation && (
            <div className="mt-2 text-xs text-muted-foreground">{q.explanation}</div>
          )}
        </div>
      ))}
      {!submitted ? (
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => {
            setSubmitted(true);
            const wrong = items
              .map((q, i) => (answers[i] === q.correct ? null : q.question))
              .filter(Boolean);
            onResult(
              `I scored ${items.reduce((n, q, i) => (answers[i] === q.correct ? n + 1 : n), 0)}/${items.length}. ` +
              (wrong.length ? `I got these wrong: ${wrong.join(' | ')}. Tell me what I misunderstood and re-teach it.` : 'All correct — what should I do next?'),
            );
          }}
        >
          Mark my answers
        </Button>
      ) : (
        <div className="text-sm font-medium">Score: {score} / {items.length}</div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------- main page */

const BrightSphereWorkplacePage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile() as any;

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [forced, setForced] = useState<Capability | null>(null);
  const [listening, setListening] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; base64: string; mime: string; dataUrl?: string } | null>(null);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [gaps, setGaps] = useState<string[]>([]);
  const [nextAction, setNextAction] = useState<Reply['nextAction'] | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, busy]);

  const grade = profile?.grade || profile?.education_level || '';

  /* voice input --------------------------------------------------------- */
  const toggleVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Voice input is not supported on this device'); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = 'en-GB';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setInput(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); toast.error('Could not hear you — try again'); };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening]);

  /* attachments --------------------------------------------------------- */
  const pickFile = (f?: File | null) => {
    if (!f) return;
    if (f.size > 12 * 1024 * 1024) { toast.error('File is too large (max 12 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setAttachment({
        name: f.name,
        base64: dataUrl.split(',')[1] ?? '',
        mime: f.type || 'application/octet-stream',
        dataUrl: f.type.startsWith('image/') ? dataUrl : undefined,
      });
    };
    reader.readAsDataURL(f);
  };

  /* the one call -------------------------------------------------------- */
  const send = useCallback(async (raw?: string, capability?: Capability | null) => {
    const text = (raw ?? input).trim();
    if (!text && !attachment) { toast.error('Type, speak or attach something first'); return; }
    if (!user) { toast.error('Sign in to use the workplace'); return; }

    const att = attachment;
    const userTurn: Turn = {
      id: crypto.randomUUID(), role: 'user',
      content: text || `Work with this file: ${att?.name}`,
      attachment: att?.name,
    };
    const history = [...turns, userTurn];
    setTurns(history);
    setInput('');
    setAttachment(null);
    setBusy(true);

    try {
      const { data, error } = await supabase.functions.invoke('brightsphere-workplace', {
        body: {
          messages: history.map((t) => ({ role: t.role, content: t.content })),
          learner: {
            name: profile?.full_name ?? '',
            grade,
            subject,
            topic,
            strengths,
            gaps,
            recent: turns.slice(-2).map((t) => t.content).join(' • '),
          },
          forceCapability: capability ?? forced ?? undefined,
          file: att && !att.dataUrl ? att.base64 : undefined,
          filename: att?.name,
          mimeType: att && !att.dataUrl ? att.mime : undefined,
          imageUrl: att?.dataUrl,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const reply = data as Reply;
      setTurns((t) => [...t, {
        id: crypto.randomUUID(), role: 'assistant',
        content: reply.message ?? '', reply,
      }]);
      if (reply.evidence?.understood?.length) {
        setStrengths((s) => Array.from(new Set([...s, ...reply.evidence!.understood!])).slice(-8));
      }
      if (reply.evidence?.gaps?.length) {
        setGaps((g) => Array.from(new Set([...g, ...reply.evidence!.gaps!])).slice(-8));
      }
      setNextAction(reply.nextAction ?? null);
      setForced(null);
    } catch (e: any) {
      toast.error(e.message || 'BrightSphere could not answer that');
      setTurns((t) => t.filter((x) => x.id !== userTurn.id));
    } finally {
      setBusy(false);
    }
  }, [input, attachment, user, turns, profile, grade, subject, topic, strengths, gaps, forced]);

  const saveToNotes = async (turn: Turn) => {
    if (!user) return;
    const title = turn.reply?.keyPoints?.[0]?.slice(0, 60) || topic || 'BrightSphere note';
    const body = [
      turn.content,
      turn.reply?.keyPoints?.length ? '\n\n' + turn.reply.keyPoints.map((k) => `- ${k}`).join('\n') : '',
    ].join('');
    try {
      const { createNote } = await import('@/lib/notesWorkspace');
      await createNote({
        title,
        content: body,
        icon: '🧠',
        tags: [subject, topic].filter(Boolean) as string[],
      });
      toast.success('Saved to your notes');
    } catch (e: any) {
      toast.error(e?.message || 'Could not save to notes');
    }
  };

  const header = useMemo(() => (
    <Card className="rounded-3xl border-border/50 bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">BrightSphere AI Workplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One workspace. Ask, upload, snap or speak — BrightSphere explains, practises, marks, creates and plans
            around what you actually need next.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (e.g. Mathematics)"
          className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic you are working on"
          className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
    </Card>
  ), [subject, topic]);

  return (
    <div className="space-y-5">
      {header}

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* conversation */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-border/50 p-4">
            <div className="flex flex-wrap gap-1.5">
              {CAPABILITIES.map((c) => {
                const Icon = c.icon;
                const active = forced === c.id;
                return (
                  <button
                    key={c.id}
                    aria-pressed={active}
                    onClick={() => setForced(active ? null : c.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
                      active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/70',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {c.label}
                  </button>
                );
              })}
            </div>

            {attachment && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs">
                <Paperclip className="h-3.5 w-3.5" />
                <span className="truncate">{attachment.name}</span>
                <button className="ml-auto" onClick={() => setAttachment(null)} aria-label="Remove attachment">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
              }}
              rows={3}
              placeholder="Ask anything, paste your work, or attach a past paper…"
              className="mt-3 resize-none rounded-2xl text-sm"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button onClick={() => send()} disabled={busy} className="rounded-full">
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
                {busy ? 'Thinking…' : 'Send'}
              </Button>
              <Button variant="outline" size="icon" className="rounded-full" onClick={toggleVoice} aria-label="Speak">
                {listening ? <MicOff className="h-4 w-4 text-rose-500" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" className="rounded-full" onClick={() => fileRef.current?.click()} aria-label="Attach a file">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full" onClick={() => cameraRef.current?.click()} aria-label="Take a photo">
                <Camera className="h-4 w-4" />
              </Button>
              {turns.length > 0 && (
                <Button variant="ghost" size="sm" className="ml-auto rounded-full" onClick={() => { setTurns([]); setNextAction(null); }}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> New session
                </Button>
              )}
              <input ref={fileRef} type="file" hidden accept=".pdf,.doc,.docx,.txt,image/*"
                onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
              <input ref={cameraRef} type="file" hidden accept="image/*" capture="environment"
                onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
            </div>

            {turns.length === 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Try</div>
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-xl bg-muted/50 px-3 py-2 text-left text-sm transition hover:bg-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {turns.map((t) => {
            if (t.role === 'user') {
              return (
                <div key={t.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {t.content}
                    {t.attachment && <div className="mt-1 text-[11px] opacity-80">📎 {t.attachment}</div>}
                  </div>
                </div>
              );
            }
            const meta = capMeta(t.reply?.capability);
            const Icon = meta.icon;
            return (
              <Card key={t.id} className="rounded-2xl border-border/50 p-4">
                <div className="flex items-center gap-2">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', meta.tint)}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                  <Button size="sm" variant="ghost" className="ml-auto h-7 rounded-full text-xs" onClick={() => saveToNotes(t)}>
                    <NotebookPen className="mr-1 h-3.5 w-3.5" /> Save to notes
                  </Button>
                </div>

                <div className="prose prose-sm mt-3 max-w-none dark:prose-invert">
                  <ReactMarkdown>{t.content}</ReactMarkdown>
                </div>

                {!!t.reply?.keyPoints?.length && (
                  <Section title="Key points">
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {t.reply!.keyPoints!.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  </Section>
                )}

                {!!t.reply?.flashcards?.length && (
                  <Section title="Flashcards"><FlashcardDeck cards={t.reply!.flashcards!} /></Section>
                )}

                {!!t.reply?.quiz?.length && (
                  <Section title="Check your understanding">
                    <QuizBlock items={t.reply!.quiz!} onResult={(summary) => send(summary, 'assess')} />
                  </Section>
                )}

                {!!t.reply?.plan?.length && (
                  <Section title="Study plan">
                    <div className="space-y-2">
                      {t.reply!.plan!.map((d) => (
                        <div key={d.day} className="rounded-xl bg-muted/40 p-3 text-sm">
                          <div className="font-medium">Day {d.day} — {d.focus}</div>
                          <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                            {(d.tasks ?? []).map((task, i) => <li key={i}>{task}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {t.reply?.mindmap && (
                  <Section title="Mind map">
                    <pre className="overflow-x-auto rounded-xl bg-muted/50 p-3 text-[11px]">{t.reply.mindmap}</pre>
                  </Section>
                )}

                {t.reply?.nextAction && (
                  <button
                    onClick={() => send(t.reply!.nextAction!.prompt, t.reply!.nextAction!.capability ?? null)}
                    className="mt-3 flex w-full items-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-left text-sm font-medium text-primary transition hover:bg-primary/15"
                  >
                    <ArrowRight className="h-4 w-4" /> {t.reply.nextAction.label}
                  </button>
                )}
              </Card>
            );
          })}

          {busy && (
            <Card className="rounded-2xl border-border/50 p-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> BrightSphere is working through it…
            </Card>
          )}
          <div ref={endRef} />
        </div>

        {/* learner model */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-border/50 p-4">
            <div className="text-sm font-semibold">Your learner model</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Built from this session — BrightSphere uses it to decide what comes next.
            </p>
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <div className="font-semibold text-muted-foreground">Level</div>
                <div className="mt-1">{grade || 'Not set'} {subject && `• ${subject}`}</div>
              </div>
              <div>
                <div className="font-semibold text-muted-foreground">Showing strength in</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {strengths.length ? strengths.map((s) => (
                    <Badge key={s} variant="secondary" className="rounded-full text-[10px]">{s}</Badge>
                  )) : <span className="text-muted-foreground">Nothing recorded yet</span>}
                </div>
              </div>
              <div>
                <div className="font-semibold text-muted-foreground">Needs work</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {gaps.length ? gaps.map((s) => (
                    <Badge key={s} className="rounded-full bg-amber-500/15 text-[10px] text-amber-700 hover:bg-amber-500/20 dark:text-amber-400">{s}</Badge>
                  )) : <span className="text-muted-foreground">Nothing recorded yet</span>}
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/50 p-4">
            <div className="text-sm font-semibold">Next best action</div>
            {nextAction ? (
              <button
                onClick={() => send(nextAction.prompt, nextAction.capability ?? null)}
                className="mt-2 flex w-full items-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-left text-sm font-medium text-primary transition hover:bg-primary/15"
              >
                <ArrowRight className="h-4 w-4" /> {nextAction.label}
              </button>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Start a conversation and BrightSphere will tell you exactly what to do next.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BrightSphereWorkplacePage;
