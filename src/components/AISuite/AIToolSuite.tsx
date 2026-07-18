import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Search, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Google Material Symbol icon (rounded). Loaded via CDN link in index.html.
 * Falls back gracefully if font not yet loaded.
 */
export const MIcon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span
    className={`material-symbols-rounded select-none ${className}`}
    style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
  >
    {name}
  </span>
);

export type Tool = {
  id: string;
  name: string;
  desc: string;
  icon: string; // material symbol name
  fields: { key: string; label: string; type?: 'text' | 'textarea'; placeholder?: string }[];
};

export type Category = { title: string; tint: string; tools: Tool[] };

export type AIToolSuiteProps = {
  title: string;
  subtitle: string;
  heroIcon: string;
  heroGradient?: string; // tailwind gradient classes for hero orb
  categories: Category[];
};

export default function AIToolSuite({
  title,
  subtitle,
  heroIcon,
  heroGradient = 'from-primary/40 via-primary/20 to-transparent',
  categories,
}: AIToolSuiteProps) {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [active, setActive] = useState<Tool | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const all = useMemo(() => categories.flatMap((c) => c.tools), [categories]);
  const filtered = useMemo(() => {
    if (!q.trim()) return categories;
    const s = q.toLowerCase();
    return categories
      .map((c) => ({ ...c, tools: c.tools.filter((t) => t.name.toLowerCase().includes(s) || t.desc.toLowerCase().includes(s)) }))
      .filter((c) => c.tools.length);
  }, [q, categories]);

  const open = (t: Tool) => {
    setActive(t);
    setValues({});
    setResult('');
  };

  const run = async () => {
    if (!active) return;
    setLoading(true);
    setResult('');
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-business-tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ tool: active.id, inputs: values }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({ error: 'Error' }));
        toast({ title: 'Error', description: e.error || 'Failed', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const reader = r.body?.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let out = '';
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const j = line.slice(6).trim();
          if (j === '[DONE]') break;
          try {
            const p = JSON.parse(j);
            const d = p.choices?.[0]?.delta?.content;
            if (d) {
              out += d;
              setResult(out);
            }
          } catch {}
        }
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    }
    setLoading(false);
  };

  const download = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active?.id || 'output'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
      {/* Hero — Apple liquid glass */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]">
        <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br ${heroGradient} blur-3xl opacity-70`} />
        <div className={`absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr ${heroGradient} blur-3xl opacity-50`} />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/80 to-white/40 dark:from-white/20 dark:to-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg flex items-center justify-center text-primary">
              <MIcon name={heroIcon} className="text-[28px]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">{subtitle}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="rounded-full px-3 py-1 bg-white/60 dark:bg-white/10 backdrop-blur border-0">
                  <MIcon name="auto_awesome" className="text-[14px] mr-1" /> {all.length} AI tools
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1 bg-white/60 dark:bg-white/10 backdrop-blur border-0">
                  <MIcon name="bolt" className="text-[14px] mr-1" /> Streaming
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1 bg-white/60 dark:bg-white/10 backdrop-blur border-0">
                  <MIcon name="verified" className="text-[14px] mr-1" /> Zambia-tuned
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-5 relative max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tools..."
              className="pl-10 h-11 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-xl border-white/60 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      {filtered.map((cat) => (
        <section key={cat.title} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{cat.title}</h2>
            <span className="text-xs text-muted-foreground">{cat.tools.length} tools</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {cat.tools.map((t) => (
              <Card
                key={t.id}
                onClick={() => open(t)}
                className={`group relative overflow-hidden cursor-pointer rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl hover:bg-white dark:hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] transition-all duration-300`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.tint} opacity-40 group-hover:opacity-60 transition-opacity`} />
                <div className="relative p-4">
                  <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur border border-white/60 dark:border-white/10 flex items-center justify-center text-primary mb-3 shadow-sm">
                    <MIcon name={t.icon} className="text-[22px]" />
                  </div>
                  <div className="font-medium text-sm text-foreground leading-tight">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">{t.desc}</div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {/* Runner */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border-white/60 dark:border-white/10 bg-white/90 dark:bg-background/90 backdrop-blur-2xl p-0">
          <DialogHeader className="p-6 pb-3 border-b border-border/40">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <MIcon name={active?.icon || 'auto_awesome'} className="text-[22px]" />
              </div>
              <div>
                <div className="text-lg font-semibold">{active?.name}</div>
                <div className="text-xs text-muted-foreground font-normal">{active?.desc}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {active && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {active.fields.map((f) =>
                  f.type === 'textarea' ? (
                    <div key={f.key} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{f.label}</label>
                      <Textarea
                        value={values[f.key] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        rows={3}
                        className="rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur border-white/60 dark:border-white/10"
                      />
                    </div>
                  ) : (
                    <div key={f.key} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{f.label}</label>
                      <Input
                        value={values[f.key] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="rounded-full bg-white/70 dark:bg-white/5 backdrop-blur border-white/60 dark:border-white/10"
                      />
                    </div>
                  )
                )}
              </div>
              <Button
                onClick={run}
                disabled={loading}
                className="w-full h-12 rounded-full text-base bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MIcon name="auto_awesome" className="text-[18px] mr-2" />
                    Generate
                  </>
                )}
              </Button>
              {result && (
                <div className="rounded-2xl border border-border/40 bg-white/60 dark:bg-white/5 backdrop-blur overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Output</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8"
                        onClick={() => {
                          navigator.clipboard.writeText(result);
                          toast({ title: 'Copied' });
                        }}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-full h-8" onClick={download}>
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                    {result}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
