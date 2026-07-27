import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Plus, Trophy, Star, Inbox } from 'lucide-react';

const GuardianRewardSystemPage = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('10');
  const [childId, setChildId] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data: links, error } = await (supabase as any).from('guardian_links').select('student_id').eq('guardian_id', user.id).eq('status', 'active');
      if (error) { toast.error('Failed to load data'); setLoading(false); return; }
      if (links?.length) {
        const ids = links.map((l: any) => l.student_id);
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids);
        setChildren(profiles || []);
        const { data: r, error: rErr } = await (supabase as any).from('guardian_rewards').select('*').eq('guardian_id', user.id).order('created_at', { ascending: false });
        if (rErr) { toast.error('Failed to load rewards'); setLoading(false); return; }
        if (r && profiles) {
          const pMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
          setRewards(r.map((x: any) => ({ ...x, student_name: pMap[x.student_id] })));
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const create = async () => {
    if (!title.trim() || !childId) return;
    const { data, error } = await (supabase as any).from('guardian_rewards').insert({ guardian_id: user!.id, student_id: childId, title, target_lessons: parseInt(target) }).select().single();
    if (error) { toast.error('Failed to create reward'); return; }
    if (data) {
      const name = children.find(c => c.id === childId)?.full_name;
      setRewards([{ ...data, student_name: name }, ...rewards]);
    }
    setTitle(''); setDialogOpen(false); toast.success('Reward created!');
  };

  const claim = async (id: string) => {
    const { error } = await (supabase as any).from('guardian_rewards').update({ claimed: true }).eq('id', id);
    if (error) { toast.error('Failed to claim reward'); return; }
    setRewards(rewards.map(r => r.id === id ? { ...r, claimed: true } : r));
    toast.success('Reward claimed! 🎉');
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="w-6 h-6 text-primary" /> Reward System</h1>
          <p className="text-sm text-muted-foreground">Motivate your children with milestone rewards</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Reward</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Reward</DialogTitle></DialogHeader>
            <Select value={childId} onValueChange={setChildId}><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger><SelectContent>{children.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent></Select>
            <Input placeholder="Reward (e.g., Movie Night)" value={title} onChange={e => setTitle(e.target.value)} />
            <Input type="number" placeholder="Target lessons" value={target} onChange={e => setTarget(e.target.value)} />
            <Button onClick={create}>Create</Button>
          </DialogContent>
        </Dialog>
      </div>

      {rewards.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="font-medium">No rewards yet</p><p className="text-sm text-muted-foreground mt-1">Create rewards to motivate your children!</p></CardContent></Card>
      ) : rewards.map(r => (
        <Card key={r.id} className={`border-border/50 ${r.claimed ? 'opacity-60' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium flex items-center gap-2">{r.claimed ? <Trophy className="w-4 h-4 text-yellow-500" /> : <Star className="w-4 h-4 text-primary" />}{r.title}</p>
                <Badge variant="outline" className="text-xs mt-1">{r.student_name}</Badge>
              </div>
              {!r.claimed && r.current_progress >= r.target_lessons && (
                <Button size="sm" onClick={() => claim(r.id)}>🎉 Claim</Button>
              )}
              {r.claimed && <Badge className="bg-green-600">Claimed</Badge>}
            </div>
            <Progress value={(r.current_progress / r.target_lessons) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{r.current_progress}/{r.target_lessons} lessons</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GuardianRewardSystemPage;
