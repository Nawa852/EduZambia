import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Camera, Upload, Volume2, Loader2, RefreshCw, Mic, MicOff, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function SnapAndSolvePage() {
  const [image, setImage] = useState<string | null>(null);
  const [extra, setExtra] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const onFile = async (files: FileList | null) => {
    if (!files?.[0]) return;
    const f = files[0];
    if (f.size > 8 * 1024 * 1024) { toast.error('Image too large (8MB max)'); return; }
    const url = await new Promise<string>((res) => {
      const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f);
    });
    setImage(url); setAnswer('');
  };

  const solve = async () => {
    if (!image) { toast.error('Add a photo first'); return; }
    setLoading(true); setAnswer('');
    try {
      const messages = [{
        role: 'user',
        content: [
          { type: 'text', text: extra || 'Solve this problem step by step. Show every working. Use LaTeX for math. End with the final boxed answer.' },
          { type: 'image_url', image_url: { url: image } },
        ],
      }];
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/ai-chat-stream`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages, role: 'student', mode: 'snap-solve', model: 'google/gemini-2.5-flash' }),
      });
      if (!resp.ok || !resp.body) {
        const t = await resp.text().catch(() => '');
        throw new Error(JSON.parse(t || '{}').error || 'Failed');
      }
      const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = ''; let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) {
          const ln = line.trim(); if (!ln.startsWith('data:')) continue;
          const p = ln.slice(5).trim(); if (p === '[DONE]') continue;
          try {
            const j = JSON.parse(p);
            const d = j.choices?.[0]?.delta?.content;
            if (d) { acc += d; setAnswer(acc); }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally { setLoading(false); }
  };

  const speak = async () => {
    if (!answer) return;
    try {
      const { data } = await supabase.functions.invoke('ai-tts', { body: { input: answer.slice(0, 2000) } });
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.src = url; audioRef.current.play(); }
    } catch { toast.error('Voice failed'); }
  };

  const toggleRecord = async () => {
    if (recording) { mediaRef.current?.stop(); return; }
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
        const fd = new FormData(); fd.append('file', blob, 'q.webm');
        try {
          const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/ai-stt`;
          const r = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: fd,
          });
          const j = await r.json();
          if (j.text) setExtra(prev => (prev ? prev + ' ' : '') + j.text);
        } catch { toast.error('Transcribe failed'); }
      };
      mr.start(); setRecording(true);
    } catch { toast.error('Mic denied'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <audio ref={audioRef} hidden />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Snap & Solve</h1>
          <p className="text-xs text-muted-foreground">Photo a problem → instant step-by-step. With voice questions and voice answers.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          {!image ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Add a clear photo of the question</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={e => onFile(e.target.files)} />
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onFile(e.target.files)} />
                <Button onClick={() => camRef.current?.click()} className="gap-2"><Camera className="w-4 h-4" /> Camera</Button>
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2"><Upload className="w-4 h-4" /> Upload</Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img src={image} alt="Problem" className="w-full rounded-xl border border-border max-h-80 object-contain bg-muted/20" />
              <button onClick={() => { setImage(null); setAnswer(''); }} className="absolute top-2 right-2 bg-background/90 border border-border rounded-full p-1 shadow">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="relative">
            <textarea
              value={extra}
              onChange={e => setExtra(e.target.value)}
              placeholder="Add a question or context (optional). Or hold the mic to ask out loud."
              className="w-full min-h-[80px] rounded-xl border border-border bg-muted/20 p-3 pr-10 text-sm focus:outline-none focus:border-primary/40"
            />
            <button
              onClick={toggleRecord}
              className={`absolute right-2 top-2 p-2 rounded-lg ${recording ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted'}`}
            >
              {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <Button onClick={solve} disabled={!image || loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Solving…' : 'Solve with BrightSphere'}
          </Button>
        </Card>

        <Card className="p-4 min-h-[300px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Step-by-step solution</h3>
            {answer && !loading && (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={speak}>
                  <Volume2 className="w-3 h-3" /> Speak
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={solve}>
                  <RefreshCw className="w-3 h-3" /> Retry
                </Button>
              </div>
            )}
          </div>
          {!answer && !loading && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Your solution will appear here, with LaTeX math and a final answer.
            </div>
          )}
          {loading && !answer && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Reading your image…
            </div>
          )}
          {answer && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{answer}</ReactMarkdown>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
