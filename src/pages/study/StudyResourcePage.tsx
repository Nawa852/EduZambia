import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StudyResourceSkeleton, StudyChatSkeleton, StudyQuizSkeleton, StudyFlashcardsSkeleton } from '@/components/UI/StudySkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { ErrorState, InlineErrorBoundary } from '@/components/UI/ErrorState';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, FileText, Sparkles, MessageSquare, Loader2, Send, StickyNote,
  ListChecks, Brain, Youtube, Link as LinkIcon,
} from 'lucide-react';


interface Resource { id: string; title: string; kind: string; mime: string|null; source_url: string|null; storage_path: string|null; extracted_text: string|null; summary: string|null; course_id: string; }

type Tab = 'source'|'summary'|'notes'|'flashcards'|'quiz'|'test'|'chat'|'tutor';

const StudyResourcePage = () => {
  const { resourceId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [r, setR] = useState<Resource|null>(null);
  const [signedUrl, setSignedUrl] = useState<string|null>(null);
  const [tab, setTab] = useState<Tab>('source');
  const [pack, setPack] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!resourceId) return;
      const { data } = await supabase.from('study_resources').select('*').eq('id', resourceId).maybeSingle();
      setR(data as any);
      if ((data as any)?.storage_path) {
        const { data: s } = await supabase.storage.from('study-resources').createSignedUrl((data as any).storage_path, 3600);
        setSignedUrl(s?.signedUrl || null);
      }
      const { data: art } = await supabase.from('study_artifacts').select('*').eq('resource_id', resourceId).eq('kind','pack').order('created_at',{ascending:false}).limit(1);
      if ((art as any)?.[0]) setPack((art as any)[0].payload);
    })();
  }, [resourceId]);

  const generatePack = async () => {
    if (!r) return;
    setBusy(true);
    try {
      let filePayload: any = {};
      if (r.storage_path && r.mime && !r.extracted_text) {
        const { data: blob } = await supabase.storage.from('study-resources').download(r.storage_path);
        if (blob) {
          const buf = await blob.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          filePayload = { file: b64, mimeType: r.mime, filename: r.title };
        }
      }
      const res = await fetch(`https://pmoxtvuhsupfpfcstlur.supabase.co/functions/v1/ai-study-kit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({ topic: r.title, text: r.extracted_text || '', ...filePayload }),
      });
      const p = await res.json();
      setPack(p);
      await supabase.from('study_artifacts').insert({ user_id: user!.id, course_id: r.course_id, resource_id: r.id, kind:'pack', title:'AI pack', payload: p } as any);
      toast.success('Pack ready');
    } catch (e:any) { toast.error(e.message); }
    setBusy(false);
  };

  if (!r) return <StudyResourceSkeleton />;

  const tabs: [Tab, string, any][] = [
    ['source','Source',FileText],['summary','Summary',StickyNote],['notes','Notes',StickyNote],
    ['flashcards','Flashcards',Sparkles],['quiz','Quiz',ListChecks],['test','Test',Brain],
    ['chat','Chat',MessageSquare],['tutor','Tutor',Brain],
  ];

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-6xl space-y-4">
      {/* Header row: back button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={()=>nav(`/study/course/${r.course_id}`)}
          aria-label="Back to folder"
          className="w-10 h-10 rounded-xl border bg-background hover:bg-muted flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold truncate flex-1">{r.title}</h1>
        {!pack && (
          <Button onClick={generatePack} disabled={busy} className="rounded-full gap-2 shrink-0">
            {busy ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
            <span className="hidden sm:inline">Build study pack</span>
          </Button>
        )}
      </div>

      {/* Underline tab bar — sticky on mobile */}
      <div className="sticky top-0 z-30 border-b overflow-x-auto scrollbar-none -mx-4 lg:-mx-6 px-4 lg:px-6 bg-background/85 supports-[backdrop-filter]:bg-background/70 backdrop-blur-md">
        <div className="flex gap-1 min-w-max">
          {tabs.map(([id,label,Icon])=>(
            <button
              key={id}
              onClick={()=>setTab(id)}
              className={`relative flex items-center gap-2 px-3 md:px-4 h-11 text-sm font-medium transition active:scale-95 ${
                tab===id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {tab===id && (
                <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <InlineErrorBoundary label="This view crashed">
        <div key={tab} className="animate-in fade-in-50 slide-in-from-bottom-1 duration-200">
          {tab === 'source' && <SourceView r={r} signedUrl={signedUrl} />}
          {tab === 'summary' && <PackView pack={pack} onGen={generatePack} busy={busy} field="summary" />}
          {tab === 'notes' && <PackView pack={pack} onGen={generatePack} busy={busy} field="notes" />}
          {tab === 'flashcards' && <FlashView pack={pack} onGen={generatePack} busy={busy} />}
          {(tab==='quiz'||tab==='test') && <QuizView pack={pack} onGen={generatePack} busy={busy} mock={tab==='test'} />}
          {(tab==='chat'||tab==='tutor') && <ChatView r={r} pack={pack} />}
        </div>
      </InlineErrorBoundary>
    </div>
  );
};

const SourceView: React.FC<{ r: Resource; signedUrl: string|null }> = ({ r, signedUrl }) => {
  if (r.kind === 'youtube') {
    const m = r.source_url?.match(/(?:v=|youtu\.be\/)([^&?]+)/);
    return m ? <div className="aspect-video rounded-2xl overflow-hidden"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${m[1]}`} allowFullScreen /></div> : null;
  }
  if (r.kind === 'url' && r.source_url) return <Card className="p-4 rounded-2xl"><a href={r.source_url} target="_blank" rel="noreferrer" className="text-primary underline">{r.source_url}</a></Card>;
  if (signedUrl && r.mime?.startsWith('image/')) return <img src={signedUrl} alt={r.title} className="rounded-2xl w-full" />;
  if (signedUrl && r.mime === 'application/pdf') return <iframe src={signedUrl} className="w-full rounded-2xl" style={{height:'70vh'}} />;
  if (signedUrl) return <Card className="p-4 rounded-2xl"><a href={signedUrl} target="_blank" rel="noreferrer" className="text-primary underline">Download {r.title}</a></Card>;
  if (r.extracted_text) return <Card className="p-4 rounded-2xl"><pre className="whitespace-pre-wrap text-sm">{r.extracted_text}</pre></Card>;
  return <Card className="p-6 text-sm text-muted-foreground rounded-2xl">No preview available.</Card>;
};

const PackView: React.FC<{ pack:any; onGen:()=>void; busy:boolean; field:'summary'|'notes' }> = ({ pack, onGen, busy, field }) => {
  if (busy) return <StudyResourceSkeleton />;
  if (!pack) return <Empty onGen={onGen} busy={busy} />;
  const md = field === 'summary' ? pack.summary : [pack.summary, ...(pack.keyPoints||[]).map((p:string)=>`- ${p}`)].join('\n\n');
  return <Card className="p-5 rounded-2xl"><div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{md||''}</ReactMarkdown></div></Card>;
};

const FlashView: React.FC<{ pack:any; onGen:()=>void; busy:boolean }> = ({ pack, onGen, busy }) => {
  const [flip, setFlip] = useState<Record<number,boolean>>({});
  if (busy) return <StudyFlashcardsSkeleton />;
  if (!pack) return <Empty onGen={onGen} busy={busy} />;
  const cards = pack.flashcards || [];
  if (!cards.length) return <EmptyState icon={Sparkles} title="No flashcards yet" description="Rebuild the study pack to generate flashcards." actionLabel="Rebuild pack" onAction={onGen} />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {cards.map((c:any,i:number)=>(
        <button key={i} onClick={()=>setFlip(f=>({...f,[i]:!f[i]}))} className="p-4 rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md text-left min-h-[120px] transition active:scale-[0.98]">
          <p className="text-[10px] uppercase text-muted-foreground mb-1">{flip[i]?'Answer':'Question'}</p>
          <p className="text-sm font-medium">{flip[i]?c.a:c.q}</p>
        </button>
      ))}
    </div>
  );
};

const QuizView: React.FC<{ pack:any; onGen:()=>void; busy:boolean; mock:boolean }> = ({ pack, onGen, busy, mock }) => {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number|null>(null);
  const [score, setScore] = useState(0);
  if (!pack) return <Empty onGen={onGen} busy={busy} />;
  const qs = pack.quiz || [];
  const q = qs[i];
  if (!q) return null;
  const pick = (n:number) => { if (picked!==null) return; setPicked(n); if (n===q.correct) setScore(s=>s+1); };
  return (
    <Card className="p-5 rounded-2xl">
      <div className="flex justify-between mb-3"><Badge variant="outline">{mock?'Mock exam':'Quiz'} · {i+1}/{qs.length}</Badge><Badge className="bg-emerald-500/10 text-emerald-600 border-0">Score {score}</Badge></div>
      <p className="font-medium mb-3">{q.question}</p>
      <div className="space-y-1.5">
        {q.options.map((o:string,n:number)=>{
          const ok = picked!==null && n===q.correct; const bad = picked===n && n!==q.correct;
          return <button key={n} onClick={()=>pick(n)} disabled={picked!==null} className={`w-full text-left p-3 rounded-xl border text-sm ${ok?'bg-emerald-500/10 border-emerald-500':''} ${bad?'bg-destructive/10 border-destructive':''} ${picked===null?'hover:border-primary':''}`}>{o}</button>;
        })}
      </div>
      {picked!==null && q.explanation && <div className="mt-3 p-3 rounded-xl bg-muted text-xs"><b>Why:</b> {q.explanation}</div>}
      {picked!==null && i<qs.length-1 && <Button className="mt-3 w-full rounded-full" onClick={()=>{setI(x=>x+1);setPicked(null);}}>Next</Button>}
    </Card>
  );
};

const ChatView: React.FC<{ r: Resource; pack: any }> = ({ r, pack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{role:'user'|'assistant';content:string}[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); },[messages]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const q = input.trim();
    const next = [...messages, { role:'user' as const, content:q }];
    setMessages(next); setInput(''); setBusy(true);
    try {
      const ctx = [r.extracted_text, pack?.summary, (pack?.keyPoints||[]).join('\n')].filter(Boolean).join('\n\n');
      const res = await fetch(`https://pmoxtvuhsupfpfcstlur.supabase.co/functions/v1/ai-study-tutor`,{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`},
        body: JSON.stringify({ context: `Resource: ${r.title}\n\n${ctx}`, messages: next }),
      });
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let acc='';
      setMessages(m=>[...m,{role:'assistant',content:''}]);
      while (true) { const {done,value}=await reader.read(); if(done)break;
        for (const line of dec.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const p=line.slice(6).trim(); if(p==='[DONE]')continue;
          try { const j=JSON.parse(p); const d=j.choices?.[0]?.delta?.content; if(d){acc+=d; setMessages(m=>{const c=[...m];c[c.length-1]={role:'assistant',content:acc};return c;});} } catch {}
        }
      }
    } catch(e:any){ toast.error(e.message); }
    setBusy(false);
  };

  return (
    <Card className="rounded-2xl flex flex-col" style={{height:'60vh',minHeight:400}}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length===0 && <div className="text-center text-sm text-muted-foreground py-8">Ask anything about "{r.title}"</div>}
        {messages.map((m,i)=>(
          <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role==='user'?'bg-primary text-primary-foreground':'bg-muted'}`}>
              {m.role==='assistant'?<div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{m.content||'…'}</ReactMarkdown></div>:m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex gap-2">
        <Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask about this material…" disabled={busy}/>
        <Button onClick={send} disabled={busy||!input.trim()} size="icon">{busy?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}</Button>
      </div>
    </Card>
  );
};

const Empty: React.FC<{ onGen:()=>void; busy:boolean }> = ({ onGen, busy }) => (
  <Card className="p-10 rounded-2xl border-dashed text-center">
    <Sparkles className="w-10 h-10 text-primary/40 mx-auto mb-2" />
    <p className="text-sm text-muted-foreground mb-3">Build the AI study pack to unlock notes, flashcards and quizzes.</p>
    <Button onClick={onGen} disabled={busy} className="rounded-full gap-2">{busy?<Loader2 className="w-4 h-4 animate-spin"/>:<Sparkles className="w-4 h-4"/>} Build pack</Button>
  </Card>
);

export default StudyResourcePage;
