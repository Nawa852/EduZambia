import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, ExternalLink, MessageSquare, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Mentor { id: string; user_id: string | null; name: string; expertise: string | null; bio: string | null; sectors: string[] | null; contact_email?: string | null; linkedin_url: string | null; directory_type: string; province: string | null; is_verified: boolean; created_by: string; }

const PROVINCES = ['Lusaka', 'Copperbelt', 'Central', 'Eastern', 'Northern', 'Southern', 'Western', 'Luapula', 'Muchinga', 'North-Western'];

export default function MentorDirectoryPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Mentor[]>([]);
  const [filter, setFilter] = useState<'all' | 'mentor' | 'investor'>('all');
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState<Mentor | null>(null);
  const [reqMsg, setReqMsg] = useState('');
  const [form, setForm] = useState({ name: '', expertise: '', bio: '', contact_email: '', linkedin_url: '', directory_type: 'mentor', province: '', sectors: '' });

  const load = async () => {
    const { data } = await supabase.from('mentors_directory').select('id, user_id, name, expertise, bio, sectors, linkedin_url, directory_type, province, is_verified, created_by, created_at').order('is_verified', { ascending: false }).order('created_at', { ascending: false });
    setList((data as Mentor[]) || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !user) return;
    const { error } = await supabase.from('mentors_directory').insert({
      ...form, sectors: form.sectors ? form.sectors.split(',').map(s => s.trim()).filter(Boolean) : null, created_by: user.id,
    });
    if (error) toast.error('Failed'); else { toast.success('Added!'); setOpen(false); load(); }
  };

  const sendRequest = async () => {
    if (!contact || !user || !reqMsg.trim()) return;
    const { error } = await supabase.from('mentor_requests').insert({ mentor_id: contact.id, requester_id: user.id, message: reqMsg.trim() });
    if (error) toast.error('Failed'); else { toast.success('Request sent!'); setContact(null); setReqMsg(''); }
  };

  const filtered = filter === 'all' ? list : list.filter(m => m.directory_type === filter);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" />Mentors & Investors</h2>
          <p className="text-sm text-muted-foreground">Connect with Zambian business leaders</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={v => setFilter(v as any)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="mentor">Mentors</SelectItem>
              <SelectItem value="investor">Investors</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Entry</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add to Directory</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Select value={form.directory_type} onValueChange={v => setForm(f => ({ ...f, directory_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="mentor">Mentor</SelectItem><SelectItem value="investor">Investor</SelectItem></SelectContent>
                </Select>
                <Input placeholder="Expertise (e.g. Marketing, FinTech)" value={form.expertise} onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))} />
                <Textarea placeholder="Bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                <Input placeholder="Sectors (comma separated)" value={form.sectors} onChange={e => setForm(f => ({ ...f, sectors: e.target.value }))} />
                <Select value={form.province} onValueChange={v => setForm(f => ({ ...f, province: v }))}>
                  <SelectTrigger><SelectValue placeholder="Province" /></SelectTrigger>
                  <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                <Input placeholder="LinkedIn URL" value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} />
                <Button className="w-full" onClick={create}>Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? <p className="col-span-full text-center text-muted-foreground py-8">No entries yet</p> : filtered.map(m => (
          <Card key={m.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-1">{m.name}{m.is_verified && <CheckCircle className="w-4 h-4 text-blue-500" />}</CardTitle>
                <Badge variant={m.directory_type === 'investor' ? 'default' : 'secondary'}>{m.directory_type}</Badge>
              </div>
              <CardDescription>{m.expertise}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {m.bio && <p className="text-xs text-muted-foreground line-clamp-3">{m.bio}</p>}
              {m.province && <p className="text-xs">📍 {m.province}</p>}
              {m.sectors && m.sectors.length > 0 && <div className="flex flex-wrap gap-1">{m.sectors.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}</div>}
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={() => setContact(m)}><MessageSquare className="w-3 h-3 mr-1" />Request</Button>
                {m.linkedin_url && <Button size="sm" variant="outline" asChild><a href={m.linkedin_url} target="_blank" rel="noreferrer"><ExternalLink className="w-3 h-3" /></a></Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!contact} onOpenChange={o => !o && setContact(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request intro from {contact?.name}</DialogTitle></DialogHeader>
          <Textarea placeholder="Tell them about you and what you're looking for..." value={reqMsg} onChange={e => setReqMsg(e.target.value)} rows={5} />
          <Button onClick={sendRequest}>Send Request</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
