import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download, Sparkles, Loader2, FileText, Send, ListChecks, Layers, MessageSquare, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getResourceUrl, type RepositoryItem } from '@/lib/resourceRepository';

type Mode = 'preview' | 'summary' | 'flashcards' | 'quiz' | 'ask';

interface StudyKit {
  summary?: string;
  keyPoints?: string[];
  flashcards?: { q: string; a: string }[];
  quiz?: { question: string; options: string[]; correct: number; explanation: string }[];
}

interface Props {
  item: RepositoryItem | null;
  onClose: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] || '');
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

const TABS: { id: Mode; label: string; icon: React.ElementType }[] = [
  { id: 'preview', label: 'File', icon: Eye },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Quiz', icon: ListChecks },
  { id: 'ask', label: 'Ask', icon: MessageSquare },
];

/**
 * The one file opener used everywhere in Synapse: preview any format plus
 * AI summary, flashcards, quiz and Q&A grounded in the file itself.
 */
export const ResourceViewer: React.FC<Props> = ({ item, onClose }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('preview');
  const [kit, setKit] = useState<StudyKit | null>(null);
  const [working, setWorking] = useState(false);
  const [reveal, setReveal] = useState<Record<number, boolean>>({});
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [asking, setAsking] = useState(false);
  const fileRef = useRef<{ base64: string; mime: string } | null>(null);

  useEffect(() => {
    setUrl(null); setMode('preview'); setKit(null); setThread([]); setReveal({}); setPicked({});
    fileRef.current = null;
    if (!item) return;
    let active = true;
    getResourceUrl(item).then((u) => {
      if (!active) return;
      if (!u) toast.error('Could not open this file');
      setUrl(u);
    });
    return () => { active = false; };
  }, [item]);

  const readFile = useCallback(async () => {
    if (fileRef.current) return fileRef.current;
    if (!item || !url) throw new Error('File is still loading.');
    const blob = await (await fetch(url)).blob();
    fileRef.current = { base64: await blobToBase64(blob), mime: item.mime_type || blob.type || 'application/pdf' };
    return fileRef.current;
  }, [item, url]);

  const buildKit = useCallback(async () => {
    if (!item || kit || working) return;
    setWorking(true);
    try {
      const file = await readFile();
      const { data, error } = await supabase.functions.invoke('ai-study-kit', {
        body: {
          topic: [item.subject, item.title].filter(Boolean).join(' — '),
          file: file.base64,
          filename: item.title,
          mimeType: file.mime,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setKit(data as StudyKit);
    } catch (e) {
      toast.error((e as Error).message || 'Could not analyse this file.');
    } finally {
      setWorking(false);
    }
  }, [item, kit, working, readFile]);

  const go = (next: Mode) => {
    setMode(next);
    if (next !== 'preview' && next !== 'ask') void buildKit();
  };

  const ask = async () => {
    const q = question.trim();
    if (!q || !item) return;
    setQuestion('');
    setThread((t) => [...t, { role: 'user', content: q }]);
    setAsking(true);
    try {
      const context = kit?.summary
        ? `Summary of the document:\n${kit.summary}`
        : 'The student is asking about their uploaded document.';
      const { data, error } = await supabase.functions.invoke('ai-study-chat', {
        body: {
          messages: [
            { role: 'system', content: `You are helping with the file "${item.title}". ${context}` },
            ...thread,
            { role: 'user', content: q },
          ],
        },
      });
      if (error) throw error;
      const reply = (data as { reply?: string; message?: string })?.reply
        ?? (data as { message?: string })?.message
        ?? 'I could not read that file well enough to answer.';
      setThread((t) => [...t, { role: 'assistant', content: reply }]);
    } catch (e) {
      toast.error((e as Error).message || 'Could not answer right now.');
    } finally {
      setAsking(false);
    }
  };

  const renderPreview = () => {
    if (!url) return <Skeleton className="w-full h-[55vh] rounded-xl" />;
    if (item?.kind === 'image') {
      return <img src={url} alt={item.title} className="w-full max-h-[65vh] object-contain rounded-xl" />;
    }
    if (item?.kind === 'video') {
      return <video src={url} controls className="w-full max-h-[65vh] rounded-xl" />;
    }
    if (item?.kind === 'audio') {
      return <audio src={url} controls className="w-full" />;
    }
    if (item?.kind === 'pdf') {
      return <iframe src={url} title={item.title} className="w-full h-[65vh] rounded-xl border border-border/60" />;
    }
    return (
      <div className="text-center py-14 space-y-3">
        <FileText className="w-10 h-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Preview isn’t available for this format.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <a href={url} target="_blank" rel="noreferrer"><Download className="w-4 h-4 mr-2" /> Download</a>
        </Button>
      </div>
    );
  };

  const renderAI = () => {
    if (working) {
      return (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="w-7 h-7 mx-auto animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Reading your file…</p>
        </div>
      );
    }
    if (!kit) {
      return (
        <div className="py-12 text-center space-y-3">
          <Sparkles className="w-7 h-7 mx-auto text-primary" />
          <Button className="rounded-xl" onClick={buildKit}>Analyse this file</Button>
        </div>
      );
    }
    if (mode === 'summary') {
      return (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{kit.summary || 'No summary produced.'}</p>
          {!!kit.keyPoints?.length && (
            <ul className="space-y-2">
              {kit.keyPoints.map((p, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-primary">•</span>{p}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    if (mode === 'flashcards') {
      if (!kit.flashcards?.length) return <p className="text-sm text-muted-foreground py-8 text-center">No flashcards for this file.</p>;
      return (
        <div className="space-y-2">
          {kit.flashcards.map((c, i) => (
            <button
              key={i}
              onClick={() => setReveal((r) => ({ ...r, [i]: !r[i] }))}
              className="w-full text-left rounded-2xl border border-border/60 bg-card/60 p-4 hover:border-primary/40 transition-colors"
            >
              <p className="text-sm font-medium">{c.q}</p>
              {reveal[i]
                ? <p className="text-sm text-muted-foreground mt-2">{c.a}</p>
                : <p className="text-xs text-muted-foreground mt-2">Tap to reveal</p>}
            </button>
          ))}
        </div>
      );
    }
    if (!kit.quiz?.length) return <p className="text-sm text-muted-foreground py-8 text-center">No quiz for this file.</p>;
    return (
      <div className="space-y-3">
        {kit.quiz.map((q, qi) => (
          <div key={qi} className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-2">
            <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const chosen = picked[qi];
                const state = chosen === undefined ? '' : oi === q.correct
                  ? 'border-primary bg-primary/10'
                  : oi === chosen ? 'border-destructive bg-destructive/10' : '';
                return (
                  <button
                    key={oi}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    className={`w-full text-left text-sm rounded-xl border border-border/60 px-3 py-2 transition-colors ${state}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {picked[qi] !== undefined && (
              <p className="text-xs text-muted-foreground">{q.explanation}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderAsk = () => (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {thread.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">
            Ask anything about this file — explanations, examples, exam-style answers.
          </p>
        )}
        {thread.map((m, i) => (
          <div
            key={i}
            className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap ${
              m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            {m.content}
          </div>
        ))}
        {asking && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </div>
      <div className="flex gap-2 pt-3">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void ask(); }}
          placeholder="Ask about this file…"
          aria-label="Ask about this file"
          className="rounded-xl"
        />
        <Button className="rounded-xl" onClick={ask} disabled={asking || !question.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate pr-8 text-base">{item?.title}</DialogTitle>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item?.subject && <Badge variant="secondary" className="text-[10px]">{item.subject}</Badge>}
            <Badge variant="outline" className="text-[10px]">{item?.kind}</Badge>
            {item?.folder_path && <Badge variant="outline" className="text-[10px]">{item.folder_path}</Badge>}
          </div>
        </DialogHeader>

        <div className="flex gap-1 overflow-x-auto border-b border-border/60 -mx-1 px-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => go(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                mode === t.id
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="pt-3">
          {mode === 'preview' ? renderPreview() : mode === 'ask' ? renderAsk() : renderAI()}
        </div>

        {url && mode === 'preview' && (
          <Button asChild variant="outline" className="rounded-xl w-full">
            <a href={url} target="_blank" rel="noreferrer" download>
              <Download className="w-4 h-4 mr-2" /> Download
            </a>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResourceViewer;
