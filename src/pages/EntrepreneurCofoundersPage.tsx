import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function EntrepreneurCofoundersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ target_email: '', skills: '', message: '' });

  const { data: matches = [] } = useQuery({
    queryKey: ['cofounders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('venture_cofounder_matches').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('venture_cofounder_matches').insert({
        user_id: user.user!.id,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        message: form.message,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Request sent'); setOpen(false); setForm({ target_email: '', skills: '', message: '' }); qc.invalidateQueries({ queryKey: ['cofounders'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Users className="w-5 h-5" /></div>
          <div><h1 className="text-2xl font-bold">Co-founder Matches</h1><p className="text-sm text-muted-foreground">Find complementary skills for your venture</p></div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Post co-founder request</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Skills needed (comma-separated)</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="engineering, sales, finance" /></div>
              <div><Label>Message</Label><Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell potential co-founders about your venture…" /></div>
              <Button className="w-full" onClick={() => send.mutate()} disabled={send.isPending || !form.message}><Send className="w-4 h-4 mr-2" />Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {matches.length === 0 ? (
        <Card><CardContent className="text-center py-16">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-2" />
          <p className="font-medium">No requests yet</p>
          <p className="text-sm text-muted-foreground">Post what you're looking for in a co-founder</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {matches.map((m: any) => (
            <Card key={m.id}><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{m.status}</span>
                <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {(m.skills || []).map((s: string) => <span key={s} className="text-[10px] bg-secondary px-2 py-0.5 rounded">{s}</span>)}
              </div>
              <p className="text-sm">{m.message}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
