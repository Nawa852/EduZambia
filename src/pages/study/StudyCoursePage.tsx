import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { StudyCourseSkeleton } from '@/components/UI/StudySkeleton';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Upload, FileText, Image as ImageIcon, Youtube, Link as LinkIcon, MessageSquare,
  Sparkles, BookOpen, Calendar, Target, Trash2, PlayCircle, Loader2, Send, Brain, ChevronRight,
  StickyNote, ListChecks, Network,
} from 'lucide-react';

interface Course { id: string; name: string; subject: string|null; grade: string|null; emoji: string|null; color: string|null; objectives: string|null; target_grade: string|null; exam_date: string|null; daily_minutes: number|null; }
interface Resource { id: string; title: string; kind: string; mime: string|null; source_url: string|null; storage_path: string|null; extracted_text: string|null; summary: string|null; created_at: string; }
interface ChatMsg { role: 'user'|'assistant'; content: string; }

const StudyCoursePage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tab, setTab] = useState<'overview'|'resources'|'tutor'|'notes'|'flashcards'|'quizzes'|'plan'>('overview');
  const [uploading, setUploading] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [addTopic, setAddTopic] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!courseId) return;
    const { data: c } = await supabase.from('study_courses').select('*').eq('id', courseId).maybeSingle();
    setCourse(c as any);
    const { data: r } = await supabase.from('study_resources').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
    setResources((r as any) || []);
  };
  useEffect(() => { load(); }, [courseId]);

  const uploadFile = async (file: File) => {
    if (!user || !courseId) return;
    setUploading(true);
    try {
      const path = `${user.id}/${courseId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('study-resources').upload(path, file);
      if (upErr) throw upErr;
      const text = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')
        ? await file.text() : null;
      await supabase.from('study_resources').insert({
        user_id: user.id, course_id: courseId, title: file.name,
        kind: 'file', mime: file.type, storage_path: path,
        size_bytes: file.size, extracted_text: text,
      } as any);
      toast.success('Uploaded');
      load();
    } catch (e:any) { toast.error(e.message); }
    setUploading(false);
  };

  const addLink = async () => {
    if (!addUrl.trim() || !user || !courseId) return;
    const isYT = /youtu\.?be/.test(addUrl);
    await supabase.from('study_resources').insert({
      user_id: user.id, course_id: courseId,
      title: addUrl, kind: isYT ? 'youtube' : 'url', source_url: addUrl,
    } as any);
    setAddUrl('');
    toast.success('Link added');
    load();
  };

  const addTopicResource = async () => {
    if (!addTopic.trim() || !user || !courseId) return;
    await supabase.from('study_resources').insert({
      user_id: user.id, course_id: courseId,
      title: addTopic, kind: 'topic', extracted_text: `Topic: ${addTopic}`,
    } as any);
    setAddTopic('');
    toast.success('Topic added');
    load();
  };

  const deleteResource = async (r: Resource) => {
    if (!confirm('Delete this resource?')) return;
    if (r.storage_path) await supabase.storage.from('study-resources').remove([r.storage_path]);
    await supabase.from('study_resources').delete().eq('id', r.id);
    load();
  };

  const resourceIcon = (r: Resource) => {
    if (r.kind === 'youtube') return <Youtube className="w-4 h-4 text-red-500" />;
    if (r.kind === 'url') return <LinkIcon className="w-4 h-4 text-blue-500" />;
    if (r.kind === 'topic') return <Brain className="w-4 h-4 text-purple-500" />;
    if (r.mime?.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    return <FileText className="w-4 h-4 text-primary" />;
  };

  if (!course) { const { StudyCourseSkeleton } = require('@/components/UI/StudySkeleton'); return <StudyCourseSkeleton />; }

  const daysLeft = course.exam_date ? Math.max(0, Math.ceil((new Date(course.exam_date).getTime() - Date.now())/(1000*60*60*24))) : null;

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-6xl space-y-5">
      <button onClick={() => nav('/study')} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"><ArrowLeft className="w-4 h-4" /> All courses</button>

      {/* Hero */}
      <Card className="p-5 rounded-3xl border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{course.emoji || '📘'}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{course.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {course.subject && <Badge variant="secondary">{course.subject}</Badge>}
              {course.grade && <Badge variant="outline">{course.grade}</Badge>}
              {course.target_grade && <Badge className="bg-emerald-500/10 text-emerald-600 border-0"><Target className="w-3 h-3 mr-1" />Target {course.target_grade}</Badge>}
              {daysLeft !== null && <Badge className="bg-amber-500/10 text-amber-600 border-0"><Calendar className="w-3 h-3 mr-1" />{daysLeft} days to exam</Badge>}
            </div>
            {course.objectives && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{course.objectives}</p>}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          ['overview','Overview',BookOpen],
          ['resources','Resources',FileText],
          ['tutor','AI Tutor',MessageSquare],
          ['notes','Notes',StickyNote],
          ['flashcards','Flashcards',Sparkles],
          ['quizzes','Quizzes',ListChecks],
          ['plan','Study Plan',Calendar],
        ].map(([id,label,Icon]:any) => (
          <button key={id} onClick={()=>setTab(id)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-medium border transition ${tab===id?'bg-primary text-primary-foreground border-primary':'bg-background text-muted-foreground border-border hover:text-foreground'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab course={course} resources={resources} onTab={setTab} />}

      {tab === 'resources' && (
        <div className="space-y-4">
          <Card className="p-4 rounded-2xl">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-full gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload file
              </Button>
              <input ref={fileRef} type="file" hidden onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              <div className="flex gap-1 flex-1 min-w-[240px]">
                <Input value={addUrl} onChange={e=>setAddUrl(e.target.value)} placeholder="Paste URL or YouTube link" className="rounded-full" />
                <Button onClick={addLink} variant="outline" className="rounded-full">Add</Button>
              </div>
              <div className="flex gap-1 flex-1 min-w-[240px]">
                <Input value={addTopic} onChange={e=>setAddTopic(e.target.value)} placeholder="Or add a topic to study" className="rounded-full" />
                <Button onClick={addTopicResource} variant="outline" className="rounded-full">Add</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">PDF, DOCX, images, notes, audio, YouTube — all become AI-powered study material.</p>
          </Card>

          {resources.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl border-dashed">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No resources yet. Upload your first file to get started.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {resources.map(r => (
                <Card key={r.id} className="p-3 rounded-2xl hover:shadow-md transition flex items-center gap-3 cursor-pointer"
                  onClick={() => nav(`/study/resource/${r.id}`)}>
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">{resourceIcon(r)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.kind} · {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={(e)=>{e.stopPropagation();deleteResource(r);}} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'tutor' && <TutorTab course={course} />}
      {tab === 'notes' && <ArtifactTab course={course} resources={resources} kind="notes" />}
      {tab === 'flashcards' && <ArtifactTab course={course} resources={resources} kind="flashcards" />}
      {tab === 'quizzes' && <ArtifactTab course={course} resources={resources} kind="quiz" />}
      {tab === 'plan' && <PlanTab course={course} resources={resources} />}
    </div>
  );
};

/* ============ Overview ============ */
const OverviewTab: React.FC<{ course: Course; resources: Resource[]; onTab: (t: any)=>void }> = ({ course, resources, onTab }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <Card className="p-4 rounded-2xl"><p className="text-xs text-muted-foreground">Resources</p><p className="text-2xl font-bold">{resources.length}</p></Card>
    <Card className="p-4 rounded-2xl"><p className="text-xs text-muted-foreground">Daily study</p><p className="text-2xl font-bold">{course.daily_minutes || 30}<span className="text-sm text-muted-foreground"> min</span></p></Card>
    <Card className="p-4 rounded-2xl"><p className="text-xs text-muted-foreground">Target grade</p><p className="text-2xl font-bold">{course.target_grade || '—'}</p></Card>
    <Card className="p-5 rounded-2xl md:col-span-3">
      <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Jump in</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[['resources','Add material',Upload],['tutor','Ask tutor',MessageSquare],['flashcards','Flashcards',Sparkles],['quizzes','Take a quiz',ListChecks]].map(([id,label,Icon]:any)=>(
          <button key={id} onClick={()=>onTab(id)} className="p-3 rounded-xl border hover:border-primary hover:bg-primary/5 transition text-left">
            <Icon className="w-5 h-5 text-primary mb-1.5" />
            <p className="text-sm font-medium">{label}</p>
          </button>
        ))}
      </div>
    </Card>
  </div>
);

/* ============ Tutor ============ */
const TutorTab: React.FC<{ course: Course }> = ({ course }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'tutor'|'exam'|'writing'|'research'>('tutor');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('study_chat_messages').select('role, content')
        .eq('course_id', course.id).is('resource_id', null).order('created_at').limit(100);
      setMessages(((data as any) || []) as ChatMsg[]);
    })();
  }, [course.id]);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const q = input.trim();
    const next = [...messages, { role: 'user' as const, content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    await supabase.from('study_chat_messages').insert({ user_id: user!.id, course_id: course.id, role: 'user', content: q } as any);

    try {
      const ctx = `Course: ${course.name}. Subject: ${course.subject||'N/A'}. Grade: ${course.grade||'N/A'}. Objectives: ${course.objectives||'N/A'}.`;
      const res = await fetch(`https://pmoxtvuhsupfpfcstlur.supabase.co/functions/v1/ai-study-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({ mode, context: ctx, messages: next }),
      });
      if (!res.ok || !res.body) throw new Error('AI error');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      setMessages(m => [...m, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) { acc += delta; setMessages(m => { const c=[...m]; c[c.length-1]={ role:'assistant', content: acc }; return c; }); }
          } catch {}
        }
      }
      await supabase.from('study_chat_messages').insert({ user_id: user!.id, course_id: course.id, role: 'assistant', content: acc } as any);
    } catch (e:any) { toast.error(e.message); }
    setBusy(false);
  };

  return (
    <Card className="rounded-3xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: 500 }}>
      <div className="p-3 border-b flex items-center gap-1.5 overflow-x-auto">
        {[['tutor','Tutor'],['exam','Exam coach'],['writing','Writing'],['research','Research']].map(([id,label])=>(
          <button key={id} onClick={()=>setMode(id as any)}
            className={`shrink-0 h-8 px-3 rounded-full text-xs border ${mode===id?'bg-primary text-primary-foreground border-primary':'border-border'}`}>{label}</button>
        ))}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <Brain className="w-10 h-10 text-primary/40 mx-auto" />
            <p className="text-sm text-muted-foreground">Ask anything about {course.name}. Try:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Explain this course','Give me a quick quiz','Make a study plan','What are the key topics?'].map(s => (
                <button key={s} onClick={()=>setInput(s)} className="text-xs px-3 h-8 rounded-full border hover:border-primary hover:bg-primary/5">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role==='user'?'bg-primary text-primary-foreground':'bg-muted'}`}>
              {m.role === 'assistant' ? <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{m.content || '…'}</ReactMarkdown></div> : m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex gap-2">
        <Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Ask your tutor…" disabled={busy} />
        <Button onClick={send} disabled={busy||!input.trim()} size="icon">{busy?<Loader2 className="w-4 h-4 animate-spin" />:<Send className="w-4 h-4" />}</Button>
      </div>
    </Card>
  );
};

/* ============ Artifact tab (notes / flashcards / quiz) ============ */
const ArtifactTab: React.FC<{ course: Course; resources: Resource[]; kind: 'notes'|'flashcards'|'quiz' }> = ({ course, resources, kind }) => {
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();

  const load = async () => {
    const { data } = await supabase.from('study_artifacts').select('*')
      .eq('course_id', course.id).eq('kind', kind).order('created_at', { ascending: false });
    setItems((data as any)||[]);
  };
  useEffect(() => { load(); }, [course.id, kind]);

  const generate = async () => {
    setBusy(true);
    try {
      const material = resources.map(r => `${r.title}${r.extracted_text?': '+r.extracted_text.slice(0,3000):''}`).join('\n\n') || `Topic: ${course.name}`;
      const res = await fetch(`https://pmoxtvuhsupfpfcstlur.supabase.co/functions/v1/ai-study-kit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({ topic: course.name, text: material }),
      });
      const pack = await res.json();
      const payload = kind === 'notes' ? { summary: pack.summary, keyPoints: pack.keyPoints, outline: pack.outline }
                    : kind === 'flashcards' ? { cards: pack.flashcards || [] }
                    : { questions: pack.quiz || [] };
      await supabase.from('study_artifacts').insert({
        user_id: user!.id, course_id: course.id, kind,
        title: `${kind} · ${new Date().toLocaleDateString()}`,
        payload,
      } as any);
      toast.success('Generated');
      load();
    } catch (e:any) { toast.error(e.message); }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground capitalize">Generated {kind}</p>
        <Button onClick={generate} disabled={busy} size="sm" className="rounded-full gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate
        </Button>
      </div>
      {items.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border-dashed text-sm text-muted-foreground">
          Nothing yet — click Generate to create {kind} from your resources.
        </Card>
      ) : items.map((it,i) => (
        <ArtifactCard key={it.id||i} kind={kind} artifact={it} onReload={load} />
      ))}
    </div>
  );
};

const ArtifactCard: React.FC<{ kind:string; artifact:any; onReload:()=>void }> = ({ kind, artifact, onReload }) => {
  const [flipped, setFlipped] = useState<Record<number,boolean>>({});
  const [quizIdx, setQuizIdx] = useState(0);
  const [picked, setPicked] = useState<number|null>(null);
  const [score, setScore] = useState(0);

  const del = async () => {
    if (!confirm('Delete this?')) return;
    await supabase.from('study_artifacts').delete().eq('id', artifact.id);
    onReload();
  };

  if (kind === 'notes') {
    return (
      <Card className="p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{artifact.title}</h3>
          <button onClick={del}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></button>
        </div>
        {artifact.payload.summary && <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{artifact.payload.summary}</ReactMarkdown></div>}
        {artifact.payload.keyPoints && (
          <div><h4 className="text-sm font-medium mb-1">Key points</h4>
            <ul className="text-sm space-y-1 list-disc pl-5">{artifact.payload.keyPoints.map((p:string,i:number)=>(<li key={i}>{p}</li>))}</ul>
          </div>
        )}
      </Card>
    );
  }

  if (kind === 'flashcards') {
    const cards = artifact.payload.cards || [];
    return (
      <Card className="p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{artifact.title} · {cards.length} cards</h3>
          <button onClick={del}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {cards.map((c:any,i:number)=>(
            <button key={i} onClick={()=>setFlipped(f=>({...f,[i]:!f[i]}))} className="p-4 rounded-xl border bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md text-left min-h-[110px]">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">{flipped[i]?'Answer':'Question'}</p>
              <p className="text-sm font-medium">{flipped[i]?c.a:c.q}</p>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  if (kind === 'quiz') {
    const qs = artifact.payload.questions || [];
    const q = qs[quizIdx];
    if (!q) return null;
    const submit = (i:number) => {
      if (picked!==null) return;
      setPicked(i);
      if (i === q.correct) setScore(s=>s+1);
    };
    return (
      <Card className="p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{artifact.title}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{quizIdx+1}/{qs.length}</Badge>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-0">Score {score}</Badge>
            <button onClick={del}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></button>
          </div>
        </div>
        <p className="font-medium mb-3">{q.question}</p>
        <div className="space-y-1.5">
          {q.options.map((opt:string,i:number)=>{
            const isCorrect = picked!==null && i===q.correct;
            const isWrong = picked===i && i!==q.correct;
            return (
              <button key={i} onClick={()=>submit(i)} disabled={picked!==null}
                className={`w-full text-left p-3 rounded-xl border text-sm transition ${isCorrect?'bg-emerald-500/10 border-emerald-500':''} ${isWrong?'bg-destructive/10 border-destructive':''} ${picked===null?'hover:border-primary':''}`}>
                {opt}
              </button>
            );
          })}
        </div>
        {picked!==null && q.explanation && <div className="mt-3 p-3 rounded-xl bg-muted text-xs"><b>Why:</b> {q.explanation}</div>}
        {picked!==null && quizIdx<qs.length-1 && (
          <Button onClick={()=>{setQuizIdx(i=>i+1);setPicked(null);}} className="mt-3 w-full rounded-full">Next question</Button>
        )}
      </Card>
    );
  }
  return null;
};

/* ============ Plan tab ============ */
const PlanTab: React.FC<{ course: Course; resources: Resource[] }> = ({ course, resources }) => {
  const [plan, setPlan] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('study_artifacts').select('*').eq('course_id', course.id).eq('kind','plan').order('created_at',{ascending:false}).limit(1);
      const p = (data as any)?.[0]?.payload?.plan;
      if (p) setPlan(p);
    })();
  }, [course.id]);

  const gen = async () => {
    setBusy(true);
    try {
      const material = resources.map(r=>r.title).join(', ') || course.name;
      const res = await fetch(`https://pmoxtvuhsupfpfcstlur.supabase.co/functions/v1/ai-study-kit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({ topic: `${course.name} — study plan for ${course.daily_minutes||30} min/day, exam ${course.exam_date||'soon'}`, text: material }),
      });
      const pack = await res.json();
      const p = pack.studyPlan || [];
      await supabase.from('study_artifacts').insert({ user_id: user!.id, course_id: course.id, kind:'plan', title:`Plan · ${new Date().toLocaleDateString()}`, payload:{ plan: p }} as any);
      setPlan(p);
    } catch (e:any) { toast.error(e.message); }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Personalized study plan</p>
        <Button onClick={gen} disabled={busy} size="sm" className="rounded-full gap-2">{busy?<Loader2 className="w-4 h-4 animate-spin" />:<Sparkles className="w-4 h-4" />} {plan.length?'Regenerate':'Generate plan'}</Button>
      </div>
      {plan.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border-dashed text-sm text-muted-foreground">Generate a plan tailored to your exam date and daily study time.</Card>
      ) : plan.map((d:any,i:number)=>(
        <Card key={i} className="p-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{d.day}</div>
            <p className="font-semibold">{d.focus}</p>
          </div>
          <ul className="text-sm space-y-1 pl-12 list-disc">{(d.tasks||[]).map((t:string,j:number)=>(<li key={j}>{t}</li>))}</ul>
        </Card>
      ))}
    </div>
  );
};

export default StudyCoursePage;
