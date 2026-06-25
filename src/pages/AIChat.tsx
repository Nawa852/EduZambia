import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Send, Sparkles, User, Bot, RotateCcw, Copy, Loader2, Mic, MicOff,
  Image as ImageIcon, X, MessageSquarePlus, Volume2, VolumeX, Trash2,
  Search, Brain, Camera, StopCircle, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

type Part =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;          // rendered text
  parts?: Part[];           // sent to model
  images?: string[];        // dataURLs for display
  ts: number;
}

interface Thread {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  mode: 'chat' | 'snap-solve' | 'deep-research' | 'voice';
  updatedAt: number;
}

const MODELS = [
  { id: 'google/gemini-3-flash-preview', label: 'BrightSphere Flash (fast)' },
  { id: 'google/gemini-2.5-flash', label: 'BrightSphere 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', label: 'BrightSphere Pro (deep)' },
  { id: 'openai/gpt-5-mini', label: 'BrightSphere Mini' },
  { id: 'openai/gpt-5', label: 'BrightSphere Ultra' },
];

const MODES = [
  { id: 'chat', label: 'Chat', icon: Sparkles },
  { id: 'snap-solve', label: 'Snap & Solve', icon: Camera },
  { id: 'deep-research', label: 'Deep Research', icon: Search },
  { id: 'voice', label: 'Voice', icon: Mic },
] as const;

const STORAGE_KEY = 'nexus_unified_chat_threads_v1';

const newThread = (): Thread => ({
  id: crypto.randomUUID(),
  title: 'New chat',
  messages: [],
  model: MODELS[0].id,
  mode: 'chat',
  updatedAt: Date.now(),
});

const loadThreads = (): Thread[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
};

const saveThreads = (t: Thread[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t.slice(0, 80))); } catch {}
};

const SUGGESTIONS: Record<string, string[]> = {
  chat: [
    'Explain photosynthesis for Grade 9',
    'Solve $x^2 - 5x + 6 = 0$ step by step',
    'Write a 200-word essay on climate change in Zambia',
    'Compare DC and AC current in a table',
  ],
  'snap-solve': [
    'Snap a homework page and I will solve it',
    'Upload an ECZ past paper question',
    'Upload a science diagram to label',
    'Upload a graph and I will interpret it',
  ],
  'deep-research': [
    'Deep dive: causes and effects of Zambian copper price swings',
    'Research: best agricultural methods for Zambia\'s climate zones',
    'History: pre-colonial Zambia, with sources',
    'Compare ECZ vs Cambridge curriculum',
  ],
  voice: [
    'Hold the mic and ask me anything',
    'Talk to me in English, Bemba or Nyanja',
    'Practice spoken English for an interview',
    'Quiz me out loud on Grade 12 Biology',
  ],
};

export default function AIChat() {
  const { profile } = useProfile();
  const role = (profile?.role as string) || 'student';

  const [threads, setThreads] = useState<Thread[]>(() => {
    const t = loadThreads();
    return t.length ? t : [newThread()];
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const t = loadThreads();
    return (t[0]?.id) || '';
  });
  const active = threads.find(t => t.id === activeId) || threads[0];

  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [recording, setRecording] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveThreads(threads); }, [threads]);
  useEffect(() => {
    if (!activeId && threads[0]) setActiveId(threads[0].id);
  }, [activeId, threads]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active?.messages.length, isStreaming]);

  const updateActive = (patch: Partial<Thread>) => {
    setThreads(prev => prev.map(t => t.id === active.id ? { ...t, ...patch, updatedAt: Date.now() } : t));
  };

  const startNew = () => {
    const t = newThread();
    setThreads(prev => [t, ...prev]);
    setActiveId(t.id);
    setInput(''); setImages([]);
  };

  const removeThread = (id: string) => {
    setThreads(prev => {
      const next = prev.filter(t => t.id !== id);
      if (!next.length) {
        const n = newThread();
        setActiveId(n.id);
        return [n];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const handleImages = async (files: FileList | null) => {
    if (!files) return;
    const arr: string[] = [];
    for (const f of Array.from(files).slice(0, 4)) {
      if (f.size > 8 * 1024 * 1024) { toast.error('Image too large (8MB max)'); continue; }
      arr.push(await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      }));
    }
    setImages(prev => [...prev, ...arr].slice(0, 4));
  };

  const buildParts = (text: string, imgs: string[]): Part[] => {
    if (!imgs.length) return [{ type: 'text', text }];
    return [
      { type: 'text', text: text || 'Please analyse the attached image(s).' },
      ...imgs.map(url => ({ type: 'image_url' as const, image_url: { url } })),
    ];
  };

  const playTTS = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-tts', {
        body: { input: text.slice(0, 1500), voice: 'alloy' },
      });
      if (error) throw error;
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.error('tts', e);
    }
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if ((!text && images.length === 0) || isStreaming) return;
    const parts = buildParts(text, images);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user',
      content: text || (images.length ? '[image]' : ''),
      parts, images: [...images], ts: Date.now(),
    };
    const nextMsgs = [...active.messages, userMsg];
    const title = active.messages.length === 0 && text ? text.slice(0, 40) : active.title;
    updateActive({ messages: nextMsgs, title });
    setInput(''); setImages([]);
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();
    setThreads(prev => prev.map(t => t.id === active.id
      ? { ...t, messages: [...nextMsgs, { id: assistantId, role: 'assistant', content: '', ts: Date.now() }] }
      : t));

    abortRef.current = new AbortController();
    try {
      const apiMessages = nextMsgs.map(m => ({
        role: m.role,
        content: m.parts ?? m.content,
      }));
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/ai-chat-stream`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          role,
          mode: active.mode,
          model: active.model,
        }),
        signal: abortRef.current.signal,
      });
      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => '');
        let parsed: any = {};
        try { parsed = JSON.parse(errText); } catch {}
        throw new Error(parsed.error || `Failed (${resp.status})`);
      }

      const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const ln = line.trim();
          if (!ln.startsWith('data:')) continue;
          const payload = ln.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setThreads(prev => prev.map(t => t.id === active.id
                ? { ...t, messages: t.messages.map(m => m.id === assistantId ? { ...m, content: acc } : m) }
                : t));
            }
          } catch {}
        }
      }
      if (autoSpeak && acc) playTTS(acc);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error(e.message || 'Failed to get response');
        setThreads(prev => prev.map(t => t.id === active.id
          ? { ...t, messages: t.messages.map(m => m.id === assistantId
              ? { ...m, content: `⚠️ ${e.message || 'Connection error'}. Please try again.` } : m) }
          : t));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const regenerate = () => {
    if (!active.messages.length || isStreaming) return;
    const msgs = [...active.messages];
    // drop last assistant + last user, resend last user
    while (msgs.length && msgs[msgs.length - 1].role === 'assistant') msgs.pop();
    const lastUser = msgs.pop();
    if (!lastUser) return;
    updateActive({ messages: msgs });
    setTimeout(() => {
      setInput(lastUser.content);
      setImages(lastUser.images || []);
      send(lastUser.content);
    }, 50);
  };

  const toggleRecord = async () => {
    if (recording) {
      mediaRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1500) { toast.error('Recording too short'); return; }
        const fd = new FormData();
        fd.append('file', blob, 'recording.webm');
        try {
          const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/ai-stt`;
          const r = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: fd,
          });
          const j = await r.json();
          if (j.text) {
            if (active.mode === 'voice') {
              send(j.text);
            } else {
              setInput(prev => (prev ? prev + ' ' : '') + j.text);
              textRef.current?.focus();
            }
          } else {
            toast.error('Could not transcribe audio');
          }
        } catch (err) {
          toast.error('Transcription failed');
        }
      };
      mr.start();
      setRecording(true);
    } catch {
      toast.error('Microphone permission denied');
    }
  };

  const userInitial = useMemo(
    () => ((profile?.full_name as string) || 'U').slice(0, 1).toUpperCase(),
    [profile]
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] -mx-4 -mt-4 bg-background overflow-hidden rounded-2xl border border-border/60">
      <audio ref={audioRef} hidden />

      {/* Threads sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-muted/20">
        <div className="p-3">
          <Button onClick={startNew} className="w-full rounded-xl gap-2 h-10">
            <Plus className="w-4 h-4" /> New chat
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-4">
            {threads.sort((a, b) => b.updatedAt - a.updatedAt).map(t => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  'w-full text-left rounded-lg px-3 py-2 text-sm group flex items-center gap-2 transition-colors',
                  t.id === activeId ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/60 text-muted-foreground'
                )}
              >
                <MessageSquarePlus className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate">{t.title}</span>
                <Trash2
                  onClick={(e) => { e.stopPropagation(); removeThread(t.id); }}
                  className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 hover:opacity-100"
                />
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 text-[10px] text-muted-foreground border-t border-border">
          History saved locally on this device.
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/80 backdrop-blur">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">BrightSphere AI</div>
            <div className="text-[11px] text-muted-foreground truncate">Chat · Tutor · Voice · Snap-solve · Research</div>
          </div>
          <Select value={active.mode} onValueChange={(v: any) => updateActive({ mode: v })}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODES.map(m => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  <span className="inline-flex items-center gap-2"><m.icon className="w-3 h-3" />{m.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={active.model} onValueChange={(v) => updateActive({ model: v })}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODELS.map(m => <SelectItem key={m.id} value={m.id} className="text-xs">{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant={autoSpeak ? 'default' : 'ghost'}
            size="icon" className="h-8 w-8 rounded-lg"
            onClick={() => setAutoSpeak(v => !v)}
            title={autoSpeak ? 'Stop auto-speak' : 'Auto-speak responses'}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8">
          {active.messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                  <Brain className="w-9 h-9 text-white" />
                </div>
                <h1 className="text-2xl font-bold mb-1">How can I help, {profile?.full_name?.split(' ')[0] || 'friend'}?</h1>
                <p className="text-sm text-muted-foreground">
                  Streaming markdown · LaTeX math · Code · Voice · Images · {MODES.find(m => m.id === active.mode)?.label} mode
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {(SUGGESTIONS[active.mode] || SUGGESTIONS.chat).map((s, i) => (
                  <Card
                    key={i}
                    onClick={() => { setInput(s); textRef.current?.focus(); }}
                    className="p-3 cursor-pointer hover:border-primary/40 hover:bg-accent/20 transition text-sm"
                  >
                    {s}
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 space-y-6">
              {active.messages.map(m => (
                <div key={m.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
                    <AvatarFallback className={cn(
                      'text-xs font-semibold',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gradient-to-br from-primary to-accent text-white'
                    )}>
                      {m.role === 'user' ? userInitial : <Bot className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">
                      {m.role === 'user' ? 'You' : 'BrightSphere'}
                    </div>
                    {m.images && m.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {m.images.map((img, idx) => (
                          <img key={idx} src={img} alt="" className="rounded-lg max-w-[200px] max-h-[200px] object-cover border border-border" />
                        ))}
                      </div>
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words
                      prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:p-3
                      prose-code:before:hidden prose-code:after:hidden prose-code:bg-muted prose-code:px-1 prose-code:rounded
                      prose-headings:font-semibold prose-table:text-xs">
                      {m.content ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeHighlight]}
                        >
                          {m.content}
                        </ReactMarkdown>
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {m.role === 'assistant' && m.content && !isStreaming && (
                      <div className="flex items-center gap-1 mt-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(m.content); toast.success('Copied'); }}>
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => playTTS(m.content)}>
                          <Volume2 className="w-3 h-3 mr-1" /> Speak
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={regenerate}>
                          <RotateCcw className="w-3 h-3 mr-1" /> Regenerate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-background/80 backdrop-blur p-3">
          {images.length > 0 && (
            <div className="max-w-3xl mx-auto mb-2 flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} className="h-16 w-16 rounded-lg object-cover border border-border" />
                  <button
                    onClick={() => setImages(p => p.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 bg-background border border-border rounded-full p-0.5 shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="max-w-3xl mx-auto flex items-end gap-2 p-2 rounded-2xl border border-border bg-muted/20 focus-within:border-primary/40 transition-colors">
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleImages(e.target.files)} />
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => fileRef.current?.click()}>
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button
              type="button" variant={recording ? 'destructive' : 'ghost'}
              size="icon" className="h-9 w-9 rounded-xl" onClick={toggleRecord}
            >
              {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Textarea
              ref={textRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={active.mode === 'voice' ? 'Tap mic and speak, or type…' : 'Ask anything — math, science, ECZ, coding, business…'}
              className="flex-1 min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 py-2.5 text-sm"
              rows={1}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button type="button" size="icon" className="h-9 w-9 rounded-xl" variant="destructive" onClick={stop}>
                <StopCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" size="icon" className="h-9 w-9 rounded-xl" disabled={!input.trim() && images.length === 0} onClick={() => send()}>
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2 max-w-3xl mx-auto">
            BrightSphere can make mistakes. Verify important information. Drop an image, hold mic, switch model — all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
