import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArtifactCanvas, type Artifact } from '@/components/AI/ArtifactCanvas';
import { ErrorState } from '@/components/UI/ErrorState';
import { Boxes, Network, BarChart3, Microscope, FileSpreadsheet, Wand2, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Kind = '3d' | 'mindmap' | 'chart' | 'diagram' | 'document' | 'simulation' | 'auto';

const KINDS: { id: Kind; label: string; icon: React.ElementType; tint: string }[] = [
  { id: 'auto', label: 'Auto', icon: Wand2, tint: 'bg-primary/10 text-primary' },
  { id: '3d', label: '3D scene', icon: Boxes, tint: 'bg-violet-500/10 text-violet-600' },
  { id: 'mindmap', label: 'Mind map', icon: Network, tint: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'chart', label: 'Charts', icon: BarChart3, tint: 'bg-sky-500/10 text-sky-600' },
  { id: 'diagram', label: 'Diagram', icon: Microscope, tint: 'bg-amber-500/10 text-amber-600' },
  { id: 'document', label: 'Exam / doc', icon: FileSpreadsheet, tint: 'bg-rose-500/10 text-rose-600' },
];

const EXAMPLES = [
  'A 3D interactive model of the water molecule with bond angles labelled',
  'Mind map of ECZ Grade 12 Biology: transport in plants',
  'Grade 9 Science end-of-term exam paper with a labelled cell diagram and mark scheme',
  'Charts comparing Zambia maize yield by province over the last 5 years',
  'Interactive simulation of projectile motion with angle and velocity sliders',
];

const FALLBACK_STEPS = [
  'Planning the build',
  'Writing the code',
  'Wiring up interactions',
  'Rendering the artifact',
];

const AIArtifactStudioPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [kind, setKind] = useState<Kind>('auto');
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const generate = useCallback(
    async (text?: string) => {
      const p = (text ?? prompt).trim();
      if (!p) {
        toast.error('Describe what you want built.');
        return;
      }
      setBusy(true);
      setError(null);
      setArtifact(null);
      setSteps(FALLBACK_STEPS);
      setStepIndex(0);
      if (timer.current) window.clearInterval(timer.current);
      timer.current = window.setInterval(() => {
        setStepIndex((i) => Math.min(i + 1, FALLBACK_STEPS.length - 1));
      }, 2600);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('ai-artifact', {
          body: { prompt: p, kind },
        });
        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);
        if (!data?.code) throw new Error('No artifact was returned.');
        if (Array.isArray(data.steps) && data.steps.length) setSteps(data.steps);
        setStepIndex(99);
        setArtifact(data as Artifact);
      } catch (e) {
        setError((e as Error).message || 'Generation failed.');
      } finally {
        if (timer.current) window.clearInterval(timer.current);
        setBusy(false);
      }
    },
    [prompt, kind],
  );

  return (
    <div className="space-y-5">
      <Card className="rounded-3xl border-border/50 bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
            <Boxes className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Artifact Studio</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask for a 3D model, mind map, diagram, chart or exam paper — Synapse writes the code, runs it and
              renders it live. Export to PDF, Word or HTML.
            </p>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-border/50 p-4">
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => {
            const Icon = k.icon;
            const active = kind === k.id;
            return (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
                  active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/70',
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {k.label}
              </button>
            );
          })}
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. Build a 3D model of the human heart with clickable chambers"
          className="mt-3 resize-none rounded-2xl text-sm"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={() => generate()} disabled={busy} className="rounded-full">
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1.5 h-4 w-4" />}
            {busy ? 'Building…' : 'Build it'}
          </Button>
          <span className="text-xs text-muted-foreground">Runs sandboxed in your browser</span>
        </div>

        {!artifact && !busy && (
          <div className="mt-4 space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Try</div>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setPrompt(ex); generate(ex); }}
                className="block w-full rounded-xl bg-muted/50 px-3 py-2 text-left text-sm transition hover:bg-muted"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </Card>

      {busy && (
        <Card className="rounded-2xl border-border/50 p-4">
          <div className="space-y-2.5">
            {steps.map((s, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <div key={s} className="flex items-center gap-2.5 text-sm">
                  {done ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border" />
                  )}
                  <span className={cn(done ? 'text-muted-foreground line-through' : active ? 'font-medium' : 'text-muted-foreground')}>
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {error && !busy && (
        <ErrorState title="Could not build that" description={error} onRetry={() => generate()} />
      )}

      {artifact && (
        <div className="space-y-3">
          <ArtifactCanvas artifact={artifact} onRegenerate={() => generate()} />
          {artifact.explanation && (
            <Card className="rounded-2xl border-border/50 p-4 text-sm text-muted-foreground">
              <Badge variant="secondary" className="mb-2 rounded-full text-[10px]">How it works</Badge>
              <p className="whitespace-pre-wrap">{artifact.explanation}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AIArtifactStudioPage;
