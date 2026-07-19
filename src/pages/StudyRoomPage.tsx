import React, { useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Upload, Sparkles, FileText, BookOpen, Brain, ClipboardList,
  MessageSquare, Send, RotateCw, Check, X, ChevronLeft, ChevronRight,
  Loader2, Wand2, GraduationCap, CalendarDays,
} from 'lucide-react';

type Flash = { q: string; a: string };
type Quiz = { question: string; options: string[]; correct: number; explanation: string };
type Pack = {
  title: string; subject: string; level: string;
  summary: string; keyPoints: string[];
  outline: { chapter: string; lessons: string[] }[];
  flashcards: Flash[]; quiz: Quiz[];
  studyPlan: { day: number; focus: string; tasks: string[] }[];
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] || '');
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const StudyRoomPage = () => {
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<Pack | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const generate = async () => {
    if (!topic.trim() && !text.trim() && !file) {
      toast.error('Add a topic, paste text, or upload a file first.');
      return;
    }
    setLoading(true);
    try {
      const payload: any = { topic: topic.trim(), text: text.trim() };
      if (file) {
        payload.file = await fileToBase64(file);
        payload.filename = file.name;
        payload.mimeType = file.type || 'application/pdf';
      }
      const { data, error } = await supabase.functions.invoke('ai-study-kit', { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPack(data as Pack);
      toast.success('Your study pack is ready.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setPack(null); setText(''); setFile(null); setTopic(''); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Hero */}
        <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Study Room</h1>
              <p className="text-sm text-muted-foreground">Upload any material — get an instant course, notes, flashcards, quizzes and an AI tutor that knows your file.</p>
            </div>
          </div>
        </div>

        {!pack ? (
          <UploadPanel
            topic={topic} setTopic={setTopic}
            text={text} setText={setText}
            file={file} setFile={setFile}
            loading={loading} onGenerate={generate}
            fileRef={fileRef}
          />
        ) : (
          <PackView pack={pack} onReset={reset} />
        )}
      </div>
    </div>
  );
};

const UploadPanel = ({ topic, setTopic, text, setText, file, setFile, loading, onGenerate, fileRef }: any) => (
  <div className="grid md:grid-cols-3 gap-4">
    <Card className="md:col-span-2 p-5 rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Topic (optional)</label>
        <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Grade 12 Chemistry — Organic reactions" className="mt-1.5 rounded-xl" />
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
        className="border-2 border-dashed border-border/60 hover:border-primary/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-muted/20"
      >
        <input ref={fileRef} type="file" hidden accept=".pdf,.txt,.doc,.docx,.md,image/*"
          onChange={e => setFile(e.target.files?.[0] || null)} />
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        {file ? (
          <div className="text-sm">
            <p className="font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB — click to replace</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium">Drop a PDF, notes, or textbook page</p>
            <p className="text-xs text-muted-foreground">or click to browse — PDF, DOCX, TXT, images</p>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Or paste text</label>
        <Textarea value={text} onChange={e => setText(e.target.value)} rows={6}
          placeholder="Paste lecture notes, textbook chapters, or anything you want to study..."
          className="mt-1.5 rounded-xl resize-none" />
      </div>

      <Button onClick={onGenerate} disabled={loading} size="lg" className="w-full rounded-2xl h-12 text-base">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Building your study pack…</>
                 : <><Wand2 className="w-4 h-4 mr-2" /> Generate Study Pack</>}
      </Button>
    </Card>

    <Card className="p-5 rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl space-y-3">
      <h3 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> What you'll get</h3>
      {[
        { i: BookOpen, t: 'Smart summary', d: 'A clean, exam-ready overview' },
        { i: Brain, t: 'Flashcards', d: 'Instant recall practice, 12-16 cards' },
        { i: ClipboardList, t: 'Adaptive quiz', d: '10 MCQs with explanations' },
        { i: CalendarDays, t: 'Study plan', d: '5-7 day pacing schedule' },
        { i: MessageSquare, t: 'AI tutor chat', d: 'Ask questions about your file' },
      ].map(({ i: Icon, t, d }) => (
        <div key={t} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
          <div><p className="text-sm font-medium">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div>
        </div>
      ))}
    </Card>
  </div>
);

const PackView = ({ pack, onReset }: { pack: Pack; onReset: () => void }) => (
  <div className="space-y-5">
    <Card className="p-5 rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className="bg-primary/10 text-primary border-0">{pack.subject}</Badge>
            <Badge variant="outline">{pack.level}</Badge>
          </div>
          <h2 className="text-2xl font-bold">{pack.title}</h2>
        </div>
        <Button variant="outline" onClick={onReset} className="rounded-xl"><RotateCw className="w-4 h-4 mr-2" /> New pack</Button>
      </div>
    </Card>

    <Tabs defaultValue="summary" className="space-y-4">
      <TabsList className="rounded-2xl bg-muted/60 backdrop-blur p-1 h-auto flex-wrap">
        <TabsTrigger value="summary" className="rounded-xl gap-1.5"><BookOpen className="w-4 h-4" /> Summary</TabsTrigger>
        <TabsTrigger value="outline" className="rounded-xl gap-1.5"><GraduationCap className="w-4 h-4" /> Course</TabsTrigger>
        <TabsTrigger value="flash" className="rounded-xl gap-1.5"><Brain className="w-4 h-4" /> Flashcards</TabsTrigger>
        <TabsTrigger value="quiz" className="rounded-xl gap-1.5"><ClipboardList className="w-4 h-4" /> Quiz</TabsTrigger>
        <TabsTrigger value="plan" className="rounded-xl gap-1.5"><CalendarDays className="w-4 h-4" /> Plan</TabsTrigger>
        <TabsTrigger value="chat" className="rounded-xl gap-1.5"><MessageSquare className="w-4 h-4" /> Tutor</TabsTrigger>
      </TabsList>

      <TabsContent value="summary">
        <Card className="p-6 rounded-3xl border-border/40">
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">{pack.summary}</div>
          <div className="mt-5 pt-5 border-t">
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Key points</h4>
            <ul className="space-y-2">
              {pack.keyPoints?.map((k, i) => (
                <li key={i} className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />{k}</li>
              ))}
            </ul>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="outline">
        <div className="grid md:grid-cols-2 gap-3">
          {pack.outline?.map((c, i) => (
            <Card key={i} className="p-5 rounded-2xl border-border/40 hover:border-primary/40 transition">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{i + 1}</div>
                <h4 className="font-semibold">{c.chapter}</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {c.lessons?.map((l, j) => <li key={j} className="flex gap-2"><FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />{l}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="flash"><Flashcards cards={pack.flashcards || []} /></TabsContent>
      <TabsContent value="quiz"><QuizRunner quiz={pack.quiz || []} /></TabsContent>

      <TabsContent value="plan">
        <div className="space-y-3">
          {pack.studyPlan?.map(d => (
            <Card key={d.day} className="p-4 rounded-2xl border-border/40">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 text-white flex items-center justify-center font-bold">D{d.day}</div>
                <p className="font-semibold">{d.focus}</p>
              </div>
              <ul className="pl-13 space-y-1 text-sm text-muted-foreground ml-13">
                {d.tasks?.map((t, i) => <li key={i} className="flex gap-2"><Check className="w-3.5 h-3.5 mt-0.5 text-primary" />{t}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="chat"><TutorChat pack={pack} /></TabsContent>
    </Tabs>
  </div>
);

const Flashcards = ({ cards }: { cards: Flash[] }) => {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  if (!cards.length) return <Card className="p-8 text-center text-muted-foreground rounded-3xl">No flashcards yet.</Card>;
  const c = cards[i];
  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground text-center">Card {i + 1} of {cards.length}</div>
      <Card
        onClick={() => setFlip(f => !f)}
        className="p-10 md:p-16 rounded-3xl border-border/40 min-h-[280px] flex items-center justify-center text-center cursor-pointer bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition"
      >
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{flip ? 'Answer' : 'Question'}</div>
          <p className="text-lg md:text-xl font-medium">{flip ? c.a : c.q}</p>
          <p className="text-xs text-muted-foreground mt-6">Tap to {flip ? 'see question' : 'reveal answer'}</p>
        </div>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => { setFlip(false); setI(Math.max(0, i - 1)); }} disabled={i === 0} className="rounded-xl"><ChevronLeft className="w-4 h-4" /></Button>
        <Progress value={((i + 1) / cards.length) * 100} className="flex-1 mx-4 self-center h-1.5" />
        <Button variant="outline" onClick={() => { setFlip(false); setI(Math.min(cards.length - 1, i + 1)); }} disabled={i === cards.length - 1} className="rounded-xl"><ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
};

const QuizRunner = ({ quiz }: { quiz: Quiz[] }) => {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  if (!quiz.length) return <Card className="p-8 text-center text-muted-foreground rounded-3xl">No quiz yet.</Card>;
  const q = quiz[i];
  const selected = answers[i];
  const score = useMemo(() => quiz.reduce((s, qq, idx) => s + (answers[idx] === qq.correct ? 1 : 0), 0), [answers, quiz]);

  if (done) return (
    <Card className="p-8 rounded-3xl text-center space-y-3">
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center"><GraduationCap className="w-8 h-8" /></div>
      <h3 className="text-2xl font-bold">You scored {score} / {quiz.length}</h3>
      <p className="text-muted-foreground">{score === quiz.length ? 'Perfect run!' : score >= quiz.length * 0.7 ? 'Solid work — keep polishing weak spots.' : 'Review the summary and try again.'}</p>
      <Button onClick={() => { setAnswers({}); setI(0); setDone(false); }} className="rounded-xl">Retry quiz</Button>
    </Card>
  );

  return (
    <Card className="p-6 rounded-3xl space-y-4">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Question {i + 1} of {quiz.length}</span>
        <span>Score: {score}</span>
      </div>
      <Progress value={((i + 1) / quiz.length) * 100} className="h-1.5" />
      <h3 className="font-semibold text-lg">{q.question}</h3>
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          const isSel = selected === idx;
          const isCorrect = q.correct === idx;
          const show = selected !== undefined;
          return (
            <button
              key={idx}
              onClick={() => selected === undefined && setAnswers({ ...answers, [i]: idx })}
              disabled={selected !== undefined}
              className={`w-full text-left p-3 rounded-xl border transition ${
                !show ? 'border-border hover:border-primary hover:bg-primary/5'
                : isCorrect ? 'border-emerald-500 bg-emerald-500/10'
                : isSel ? 'border-red-500 bg-red-500/10'
                : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                {show && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                {show && isSel && !isCorrect && <X className="w-4 h-4 text-red-600" />}
                {opt}
              </div>
            </button>
          );
        })}
      </div>
      {selected !== undefined && (
        <div className="p-3 rounded-xl bg-muted/60 text-sm"><span className="font-medium">Explanation: </span>{q.explanation}</div>
      )}
      <div className="flex justify-end">
        <Button disabled={selected === undefined} onClick={() => i === quiz.length - 1 ? setDone(true) : setI(i + 1)} className="rounded-xl">
          {i === quiz.length - 1 ? 'See results' : 'Next'}
        </Button>
      </div>
    </Card>
  );
};

const TutorChat = ({ pack }: { pack: Pack }) => {
  const context = `The student is studying: "${pack.title}" (${pack.subject}, ${pack.level}).
Summary of their material:\n${pack.summary}\n\nKey points:\n- ${pack.keyPoints?.join('\n- ')}\n\nAnswer questions using this material as ground truth. Be concise, use examples, and encourage the student.`;
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: `Hi! I've read your material on **${pack.title}**. Ask me anything — I can explain, quiz you, or break it down step by step.` },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const q = input.trim();
    if (!q || sending) return;
    const next = [...msgs, { role: 'user' as const, content: q }];
    setMsgs(next); setInput(''); setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-study-chat', {
        body: { messages: [{ role: 'system', content: context }, ...next] },
      });
      if (error) throw error;
      setMsgs([...next, { role: 'assistant', content: data.content || '…' }]);
    } catch (e: any) {
      toast.error(e.message || 'Chat failed');
    } finally { setSending(false); }
  };

  return (
    <Card className="rounded-3xl border-border/40 overflow-hidden flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>{m.content}</div>
          </div>
        ))}
        {sending && <div className="flex justify-start"><div className="bg-muted px-4 py-2.5 rounded-2xl text-sm"><Loader2 className="w-4 h-4 animate-spin" /></div></div>}
      </div>
      <div className="border-t p-3 flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your material…" className="rounded-xl" />
        <Button onClick={send} disabled={!input.trim() || sending} className="rounded-xl"><Send className="w-4 h-4" /></Button>
      </div>
    </Card>
  );
};

export default StudyRoomPage;
