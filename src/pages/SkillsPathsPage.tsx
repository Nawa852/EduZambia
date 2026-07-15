import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Route, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SkillsPathsPage() {
  const qc = useQueryClient();
  const [target, setTarget] = useState('');
  const [level, setLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);

  const { data: paths = [] } = useQuery({
    queryKey: ['learning-paths'],
    queryFn: async () => {
      const { data } = await supabase.from('learning_paths').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const generate = async () => {
    if (!target) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-learning-path', {
        body: { skill: target, level, goal: `Become job-ready in ${target}` },
      });
      if (error) throw error;
      const { data: user } = await supabase.auth.getUser();
      const steps = data.steps || data.path || data.modules || [];
      const { error: insErr } = await supabase.from('learning_paths').insert({
        user_id: user.user!.id, title: `Path to ${target}`,
        steps, progress: 0, generated_by_ai: true,
      });
      if (insErr) throw insErr;
      toast.success('Path generated');
      setTarget('');
      qc.invalidateQueries({ queryKey: ['learning-paths'] });
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const toggleStep = async (path: any, i: number) => {
    const steps = (path.steps as any[]).map((s: any, idx: number) => idx === i ? { ...s, done: !s.done } : s);
    const done = steps.filter((s: any) => s.done).length;
    const progress = Math.round((done / steps.length) * 100);
    await supabase.from('learning_paths').update({ steps, progress } as any).eq('id', path.id);
    qc.invalidateQueries({ queryKey: ['learning-paths'] });
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Route className="w-5 h-5" /></div>
        <div><h1 className="text-2xl font-bold">Learning Paths</h1><p className="text-sm text-muted-foreground">AI-generated roadmaps to job-ready skills</p></div>
      </div>

      <Card><CardHeader><CardTitle>Generate new path</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label>Target skill / role</Label><Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Frontend Developer, Data Analyst…" /></div>
          <div><Label>Starting level</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>beginner</option><option>intermediate</option><option>advanced</option>
            </select>
          </div>
        </div>
        <Button onClick={generate} disabled={loading || !target}><Sparkles className="w-4 h-4 mr-2" />{loading ? 'Generating…' : 'Generate path'}</Button>
      </CardContent></Card>

      {paths.length === 0 ? (
        <Card><CardContent className="text-center py-16">
          <Route className="w-12 h-12 mx-auto text-muted-foreground/40 mb-2" />
          <p className="font-medium">No paths yet</p>
          <p className="text-sm text-muted-foreground">Generate your first learning roadmap</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {paths.map((p: any) => {
            const steps = (p.steps as any[]) || [];
            return (
              <Card key={p.id}><CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.title}</h3>
                  <span className="text-xs">{p.progress}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${p.progress}%` }} /></div>
                <div className="space-y-1">
                  {steps.slice(0, 8).map((s: any, i: number) => (
                    <button key={i} onClick={() => toggleStep(p, i)} className="flex items-start gap-2 w-full text-left p-2 rounded hover:bg-secondary/40">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${s.done ? 'text-emerald-500 fill-emerald-500/20' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${s.done ? 'line-through text-muted-foreground' : ''}`}>{s.title || s.name || s.step || `Step ${i + 1}`}</span>
                    </button>
                  ))}
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
