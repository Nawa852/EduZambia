import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Sparkles, Save, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function NgoImpactPage() {
  const qc = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [period, setPeriod] = useState('Q1 2026');
  const [beneficiaries, setBeneficiaries] = useState('');
  const [notes, setNotes] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { data: programs = [] } = useQuery({
    queryKey: ['ngo-programs'],
    queryFn: async () => {
      const { data } = await supabase.from('ngo_programs').select('id,name').order('name');
      return data || [];
    },
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['ngo-impact-reports'],
    queryFn: async () => {
      const { data } = await supabase.from('ngo_impact_reports').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const generate = async () => {
    const prog = programs.find((p: any) => p.id === selectedProgram);
    if (!prog) return toast.error('Pick a program');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-ngo-impact', {
        body: { programName: prog.name, period, beneficiaries: parseInt(beneficiaries) || 0, metrics: {}, notes },
      });
      if (error) throw error;
      setReport(data);
      toast.success('Report generated');
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!report || !selectedProgram) return;
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from('ngo_impact_reports').insert({
      user_id: user.user!.id, program_id: selectedProgram, period,
      metrics: report.kpis || {}, narrative: report.narrative || '', generated_by_ai: true,
    });
    if (error) toast.error(error.message);
    else { toast.success('Report saved'); qc.invalidateQueries({ queryKey: ['ngo-impact-reports'] }); }
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Heart className="w-5 h-5" /></div>
        <div><h1 className="text-2xl font-bold">AI Impact Reports</h1><p className="text-sm text-muted-foreground">Donor-ready narratives from your program data</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Generate report</CardTitle></CardHeader><CardContent className="space-y-3">
          <div><Label>Program</Label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger>
              <SelectContent>{programs.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Period</Label><Input value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
          <div><Label>Beneficiaries reached</Label><Input type="number" value={beneficiaries} onChange={(e) => setBeneficiaries(e.target.value)} /></div>
          <div><Label>Notes / highlights</Label><Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <Button className="w-full" onClick={generate} disabled={loading || !selectedProgram}>
            <Sparkles className="w-4 h-4 mr-2" />{loading ? 'Generating…' : 'Generate'}
          </Button>
        </CardContent></Card>

        <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Preview</CardTitle>{report && <Button size="sm" variant="outline" onClick={save}><Save className="w-4 h-4 mr-1" />Save</Button>}</CardHeader><CardContent>
          {!report ? <p className="text-sm text-muted-foreground text-center py-12">Report will appear here</p> : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto text-sm">
              <h3 className="font-bold text-lg">{report.headline}</h3>
              {report.kpis?.length > 0 && <div className="grid grid-cols-2 gap-2">
                {report.kpis.map((k: any, i: number) => (
                  <div key={i} className="p-2 rounded border"><div className="text-xs text-muted-foreground">{k.label}</div><div className="font-bold">{k.value}</div></div>
                ))}
              </div>}
              <p className="whitespace-pre-wrap">{report.narrative}</p>
              {report.recommendations?.length > 0 && <div><div className="font-semibold mb-1">Recommendations</div><ul className="list-disc list-inside space-y-1">{report.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul></div>}
            </div>
          )}
        </CardContent></Card>
      </div>

      {reports.length > 0 && (
        <Card><CardHeader><CardTitle>Saved reports</CardTitle></CardHeader><CardContent>
          <div className="space-y-2">
            {reports.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /><div><div className="font-medium">{r.period}</div><div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div></div></div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
