import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, GripVertical, Trash2, Edit2, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';

type Status = 'applied' | 'interviewing' | 'offer' | 'rejected';

interface JobApp {
  id: string;
  company: string;
  position: string;
  status: Status;
  notes: string | null;
  applied_at: string;
}

const COLUMNS: { status: Status; label: string; color: string }[] = [
  { status: 'applied', label: 'Applied', color: 'bg-blue-500/10 border-blue-500/30' },
  { status: 'interviewing', label: 'Interviewing', color: 'bg-yellow-500/10 border-yellow-500/30' },
  { status: 'offer', label: 'Offer', color: 'bg-green-500/10 border-green-500/30' },
  { status: 'rejected', label: 'Rejected', color: 'bg-red-500/10 border-red-500/30' },
];

const SkillsJobTrackerPage = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<JobApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ company: '', position: '', notes: '', status: 'applied' as Status });

  const fetchApps = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false });
    setApps((data as JobApp[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchApps(); }, [user]);

  const addApp = async () => {
    if (!user || !form.company.trim() || !form.position.trim()) {
      toast.error('Company and position are required');
      return;
    }
    const { error } = await supabase.from('job_applications').insert({
      user_id: user.id,
      company: form.company.trim(),
      position: form.position.trim(),
      notes: form.notes.trim() || null,
      status: form.status,
    });
    if (error) { toast.error('Failed to add application'); return; }
    toast.success('Application added!');
    setForm({ company: '', position: '', notes: '', status: 'applied' });
    setDialogOpen(false);
    fetchApps();
  };

  const moveApp = async (id: string, newStatus: Status) => {
    await supabase.from('job_applications').update({ status: newStatus }).eq('id', id);
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    toast.success('Status updated');
  };

  const deleteApp = async (id: string) => {
    await supabase.from('job_applications').delete().eq('id', id);
    setApps(prev => prev.filter(a => a.id !== id));
    toast.success('Removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" /> Job Application Tracker
          </h1>
          <p className="text-muted-foreground mt-1">Track your job applications through every stage</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Application</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Application</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Company name" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              <Input placeholder="Position" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLUMNS.map(c => <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button className="w-full" onClick={addApp}>Save Application</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {COLUMNS.map(col => (
          <Card key={col.status} className={`border ${col.color}`}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{apps.filter(a => a.status === col.status).length}</p>
              <p className="text-sm text-muted-foreground">{col.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map(col => (
          <div key={col.status} className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{col.label}</h3>
            <div className={`rounded-lg border-2 border-dashed p-2 min-h-[200px] space-y-2 ${col.color}`}>
              {apps.filter(a => a.status === col.status).map(app => (
                <Card key={app.id} className="shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{app.position}</p>
                        <p className="text-xs text-muted-foreground truncate">{app.company}</p>
                        {app.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{app.notes}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(app.applied_at).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteApp(app.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {COLUMNS.filter(c => c.status !== col.status).map(c => (
                        <Button key={c.status} variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => moveApp(app.id, c.status)}>
                          → {c.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {apps.filter(a => a.status === col.status).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No applications</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsJobTrackerPage;
