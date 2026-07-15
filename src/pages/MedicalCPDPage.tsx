import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, Plus, Award, Clock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CATS = ['clinical', 'research', 'teaching', 'community', 'admin'];
const COLORS = ['hsl(var(--primary))', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function MedicalCPDPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'clinical', hours: '', provider: '' });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['cpd'],
    queryFn: async () => {
      const { data, error } = await supabase.from('medical_cpd_activities').select('*').order('completed_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Sign in');
      const { error } = await supabase.from('medical_cpd_activities').insert({
        user_id: user.user.id,
        title: form.title,
        category: form.category,
        hours: parseFloat(form.hours) || 0,
        provider: form.provider,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('CPD activity logged');
      setOpen(false);
      setForm({ title: '', category: 'clinical', hours: '', provider: '' });
      qc.invalidateQueries({ queryKey: ['cpd'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalHours = activities.reduce((s: number, a: any) => s + Number(a.hours || 0), 0);
  const byCat = CATS.map((c, i) => ({
    name: c,
    value: activities.filter((a: any) => a.category === c).reduce((s: number, a: any) => s + Number(a.hours || 0), 0),
    color: COLORS[i],
  })).filter((x) => x.value > 0);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">CPD Tracker</h1>
            <p className="text-sm text-muted-foreground">Continuing Professional Development — MDA-aligned log</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Log activity</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log CPD activity</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Malaria case management workshop" /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Hours</Label><Input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div>
              <div><Label>Provider</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="UNZA, MOH, etc." /></div>
              <Button className="w-full" onClick={() => add.mutate()} disabled={add.isPending || !form.title}>{add.isPending ? 'Saving…' : 'Save'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="w-8 h-8 text-primary" /><div><div className="text-2xl font-bold">{totalHours}</div><div className="text-xs text-muted-foreground">Total hours</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Award className="w-8 h-8 text-emerald-500" /><div><div className="text-2xl font-bold">{activities.length}</div><div className="text-xs text-muted-foreground">Activities</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><BookOpen className="w-8 h-8 text-amber-500" /><div><div className="text-2xl font-bold">{Math.round((totalHours / 30) * 100)}%</div><div className="text-xs text-muted-foreground">Annual target (30h)</div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1"><CardHeader><CardTitle>Hours by category</CardTitle></CardHeader><CardContent>
          {byCat.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No data yet</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {byCat.map((_, i) => <Cell key={i} fill={byCat[i].color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent></Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle>Recent activities</CardTitle></CardHeader><CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
            activities.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-2" />
                <p className="font-medium">No CPD logged yet</p>
                <p className="text-sm text-muted-foreground">Start tracking your professional development</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-xs text-muted-foreground">{a.provider} · {a.category} · {new Date(a.completed_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm font-semibold">{a.hours}h</div>
                  </div>
                ))}
              </div>
            )}
        </CardContent></Card>
      </div>
    </div>
  );
}
