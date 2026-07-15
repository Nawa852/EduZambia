import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Sparkles, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function MedicalPatientsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ initials: '', age: '', sex: '', complaint: '' });
  const [soap, setSoap] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [aiLoading, setAiLoading] = useState(false);

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('medical_patients').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('medical_patients').insert({
        owner_id: user.user!.id,
        initials: form.initials,
        age: parseInt(form.age) || null,
        sex: form.sex,
        complaint: form.complaint,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Patient added');
      setNewOpen(false);
      setForm({ initials: '', age: '', sex: '', complaint: '' });
      qc.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const saveSoap = async () => {
    if (!selected) return;
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from('medical_case_notes').insert({
      user_id: user.user!.id, patient_id: selected.id, ...soap,
    });
    if (error) toast.error(error.message);
    else { toast.success('SOAP note saved'); setSoap({ subjective: '', objective: '', assessment: '', plan: '' }); }
  };

  const draftAI = async () => {
    if (!selected) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-soap-draft', {
        body: { initials: selected.initials, age: selected.age, sex: selected.sex, complaint: selected.complaint },
      });
      if (error) throw error;
      setSoap({ subjective: data.subjective || '', objective: data.objective || '', assessment: data.assessment || '', plan: data.plan || '' });
      toast.success('AI SOAP drafted');
    } catch (e: any) { toast.error(e.message); }
    finally { setAiLoading(false); }
  };

  const filtered = patients.filter((p: any) => !q || p.initials?.toLowerCase().includes(q.toLowerCase()) || p.complaint?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Users className="w-5 h-5" /></div>
          <div><h1 className="text-2xl font-bold">Patients</h1><p className="text-sm text-muted-foreground">De-identified caseload with SOAP notes</p></div>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New patient</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add patient</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Initials</Label><Input value={form.initials} onChange={(e) => setForm({ ...form, initials: e.target.value })} placeholder="J.M." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
                <div><Label>Sex</Label><Input value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} placeholder="M/F" /></div>
              </div>
              <div><Label>Complaint</Label><Textarea value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} /></div>
              <Button className="w-full" onClick={() => add.mutate()} disabled={!form.initials}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patients…" className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="text-center py-16">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-2" />
          <p className="font-medium">No patients yet</p>
          <p className="text-sm text-muted-foreground">Add your first patient to start tracking cases</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p: any) => (
            <Sheet key={p.id}>
              <SheetTrigger asChild>
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelected(p)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{p.initials}</div>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded">{p.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{p.age}y {p.sex}</div>
                    <p className="text-sm mt-2 line-clamp-2">{p.complaint}</p>
                  </CardContent>
                </Card>
              </SheetTrigger>
              <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader><SheetTitle>{p.initials} — SOAP note</SheetTitle></SheetHeader>
                <div className="mt-4 space-y-3">
                  <Button variant="outline" onClick={draftAI} disabled={aiLoading} className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />{aiLoading ? 'Drafting…' : 'AI Draft SOAP'}
                  </Button>
                  {(['subjective', 'objective', 'assessment', 'plan'] as const).map((k) => (
                    <div key={k}><Label className="capitalize">{k}</Label>
                      <Textarea rows={3} value={(soap as any)[k]} onChange={(e) => setSoap({ ...soap, [k]: e.target.value })} />
                    </div>
                  ))}
                  <Button className="w-full" onClick={saveSoap}>Save note</Button>
                </div>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      )}
    </div>
  );
}
