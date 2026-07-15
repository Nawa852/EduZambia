import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trophy, Plus, Coins, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function DeveloperBountiesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState<string | null>(null);
  const [submission, setSubmission] = useState({ repo_url: '', notes: '' });
  const [form, setForm] = useState({ title: '', description: '', reward_kwacha: '', tags: '', deadline: '' });

  const { data: bounties = [] } = useQuery({
    queryKey: ['bounties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('developer_bounties').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const post = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('developer_bounties').insert({
        poster_id: user.user!.id,
        title: form.title, description: form.description,
        reward_kwacha: parseFloat(form.reward_kwacha) || 0,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        deadline: form.deadline || null, status: 'open',
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Bounty posted'); setOpen(false); setForm({ title: '', description: '', reward_kwacha: '', tags: '', deadline: '' }); qc.invalidateQueries({ queryKey: ['bounties'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const submit = async (bountyId: string) => {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from('developer_bounty_submissions').insert({
      bounty_id: bountyId, developer_id: user.user!.id, ...submission,
    });
    if (error) toast.error(error.message);
    else { toast.success('Submitted'); setSubOpen(null); setSubmission({ repo_url: '', notes: '' }); }
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Trophy className="w-5 h-5" /></div>
          <div><h1 className="text-2xl font-bold">Bounty Board</h1><p className="text-sm text-muted-foreground">Open dev challenges with real rewards</p></div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Post bounty</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Post bounty</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Reward (K)</Label><Input type="number" value={form.reward_kwacha} onChange={(e) => setForm({ ...form, reward_kwacha: e.target.value })} /></div>
                <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
              <div><Label>Tags (comma)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, python" /></div>
              <Button className="w-full" onClick={() => post.mutate()} disabled={!form.title}>Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {bounties.length === 0 ? (
        <Card><CardContent className="text-center py-16">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/40 mb-2" />
          <p className="font-medium">No open bounties</p>
          <p className="text-sm text-muted-foreground">Be the first to post a challenge</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bounties.map((b: any) => (
            <Card key={b.id}><CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{b.title}</h3>
                <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">{b.status}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{b.description}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-amber-600"><Coins className="w-3 h-3" />K{b.reward_kwacha}</span>
                {b.deadline && <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" />{new Date(b.deadline).toLocaleDateString()}</span>}
              </div>
              <div className="flex flex-wrap gap-1">{(b.tags || []).map((t: string) => <span key={t} className="text-[10px] bg-secondary px-2 py-0.5 rounded">{t}</span>)}</div>
              <Dialog open={subOpen === b.id} onOpenChange={(o) => setSubOpen(o ? b.id : null)}>
                <DialogTrigger asChild><Button size="sm" variant="outline" className="w-full">Submit solution</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Submit for: {b.title}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Repo URL</Label><Input value={submission.repo_url} onChange={(e) => setSubmission({ ...submission, repo_url: e.target.value })} placeholder="https://github.com/…" /></div>
                    <div><Label>Notes</Label><Textarea value={submission.notes} onChange={(e) => setSubmission({ ...submission, notes: e.target.value })} /></div>
                    <Button className="w-full" onClick={() => submit(b.id)} disabled={!submission.repo_url}>Submit</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
