import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClipboardList, Plus, Trash2, Stethoscope, Search } from 'lucide-react';
import { useClinicalCases } from '@/hooks/useClinicalCases';
import { toast } from '@/hooks/use-toast';

const BODY_SYSTEMS = ['Infectious', 'Cardiac', 'Respiratory', 'Endocrine', 'Neurological', 'Gastrointestinal', 'Renal', 'Musculoskeletal', 'Hematological', 'Dermatological'];
const OUTCOMES = ['ongoing', 'resolved', 'referred'];

const MedicalCaseLogPage = () => {
  const { cases, loading, addCase, deleteCase } = useClinicalCases();
  const [filterSystem, setFilterSystem] = useState('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ condition: '', presenting_complaint: '', diagnosis: '', outcome: 'ongoing', body_system: '', notes: '' });

  const q = query.trim().toLowerCase();
  const filtered = cases
    .filter(c => filterSystem === 'all' || c.body_system === filterSystem)
    .filter(c => !q || [c.condition, c.diagnosis, c.presenting_complaint, c.body_system, c.notes].some(v => (v || '').toLowerCase().includes(q)));
  const systemStats = BODY_SYSTEMS.map(s => ({ name: s, count: cases.filter(c => c.body_system === s).length })).filter(s => s.count > 0);

  const handleAdd = async () => {
    if (!form.condition.trim()) { toast({ title: 'Condition is required', variant: 'destructive' }); return; }
    await addCase({ ...form, patient_summary: null, accuracy_score: null });
    setForm({ condition: '', presenting_complaint: '', diagnosis: '', outcome: 'ongoing', body_system: '', notes: '' });
    setOpen(false);
    toast({ title: 'Case logged' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Case Log 📋</h1>
          <p className="text-muted-foreground">{cases.length} cases logged</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Log Case</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Clinical Case</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Condition *" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} />
              <Input placeholder="Presenting Complaint" value={form.presenting_complaint} onChange={e => setForm(f => ({ ...f, presenting_complaint: e.target.value }))} />
              <Input placeholder="Diagnosis" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
              <Select value={form.body_system} onValueChange={v => setForm(f => ({ ...f, body_system: v }))}>
                <SelectTrigger><SelectValue placeholder="Body System" /></SelectTrigger>
                <SelectContent>{BODY_SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.outcome} onValueChange={v => setForm(f => ({ ...f, outcome: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button onClick={handleAdd} className="w-full">Save Case</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cases by condition, diagnosis, complaint, notes…"
          className="pl-9"
        />
      </div>

      {systemStats.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge variant={filterSystem === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilterSystem('all')}>All ({cases.length})</Badge>
          {systemStats.map(s => (
            <Badge key={s.name} variant={filterSystem === s.name ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilterSystem(s.name)}>{s.name} ({s.count})</Badge>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No cases logged yet. Start by clicking "Log Case".</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{c.condition}</p>
                    <p className="text-sm text-muted-foreground">{c.body_system || 'General'} • {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.accuracy_score && <Badge variant="secondary">{c.accuracy_score}%</Badge>}
                  <Badge variant={c.outcome === 'resolved' ? 'secondary' : 'default'}>{c.outcome}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => deleteCase(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalCaseLogPage;
