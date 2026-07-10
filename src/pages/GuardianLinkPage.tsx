import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Heart, Eye, Plus, Trash2, UserCheck, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { toast } from 'sonner';

interface GuardianLink {
  id: string;
  guardian_name: string;
  relationship: string;
  phone: string;
  email: string | null;
  mode: string;
  status: string;
  created_at: string;
}

const GuardianLinkPage = () => {
  const { user } = useSecureAuth();
  const [guardians, setGuardians] = useState<GuardianLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    guardian_name: '', relationship: '', phone: '', email: '', mode: 'monitor',
  });

  useEffect(() => {
    if (user) fetchGuardians();
  }, [user]);

  const fetchGuardians = async () => {
    const { data } = await supabase
      .from('guardian_links')
      .select('id, student_id, guardian_id, guardian_name, relationship, mode, status, created_at')
      .eq('student_id', user!.id)
      .order('created_at', { ascending: false });
    setGuardians((data as unknown as GuardianLink[]) || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.guardian_name || !form.phone || !form.relationship) {
      toast.error("Please fill in name, relationship, and phone number");
      return;
    }
    const { error } = await supabase.from('guardian_links').insert({
      student_id: user!.id,
      guardian_name: form.guardian_name,
      relationship: form.relationship,
      phone: form.phone,
      email: form.email || null,
      mode: form.mode,
    } as any);
    if (error) { toast.error('Failed to add guardian'); return; }
    toast.success('Guardian link created!');
    setForm({ guardian_name: '', relationship: '', phone: '', email: '', mode: 'monitor' });
    setShowForm(false);
    fetchGuardians();
  };

  const handleRemove = async (id: string) => {
    await supabase.from('guardian_links').delete().eq('id', id);
    toast.success('Guardian removed');
    fetchGuardians();
  };

  const modes = [
    { id: 'motivator', icon: Heart, label: 'Motivator', desc: 'Sends encouragement', color: 'text-pink-500' },
    { id: 'monitor', icon: Shield, label: 'Monitor', desc: 'Gets progress reports', color: 'text-blue-500' },
    { id: 'watcher', icon: Eye, label: 'Silent Watcher', desc: 'Dashboard insights only', color: 'text-purple-500' },
  ];

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800', active: 'bg-green-100 text-green-800', declined: 'bg-red-100 text-red-800',
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">My Guardians</h1>
            <p className="text-muted-foreground">Link your guardians to support your learning journey</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Guardian
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Register a Guardian</CardTitle>
            <CardDescription>Connect a trusted adult to your learning journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="Guardian's full name" value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Relationship *</Label>
                <Select value={form.relationship} onValueChange={v => setForm({ ...form, relationship: v })}>
                  <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                  <SelectContent>
                    {['Parent', 'Legal Guardian', 'Relative', 'Mentor', 'Teacher'].map(r => (
                      <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone (WhatsApp) *</Label>
                <Input type="tel" placeholder="+260..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="guardian@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Guardian Mode</Label>
              <RadioGroup value={form.mode} onValueChange={v => setForm({ ...form, mode: v })} className="grid md:grid-cols-3 gap-3">
                {modes.map(m => (
                  <Card key={m.id} className={`cursor-pointer border-2 transition-all ${form.mode === m.id ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'}`}>
                    <CardContent className="p-4">
                      <RadioGroupItem value={m.id} id={`mode-${m.id}`} className="sr-only" />
                      <label htmlFor={`mode-${m.id}`} className="cursor-pointer space-y-2">
                        <m.icon className={`w-8 h-8 ${m.color}`} />
                        <h4 className="font-semibold text-sm">{m.label}</h4>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </label>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Create Guardian Link</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading guardians...</div>
      ) : guardians.length === 0 && !showForm ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserCheck className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Guardians Linked</h3>
            <p className="text-muted-foreground mb-4">Add a guardian to get support and accountability on your learning journey.</p>
            <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Your First Guardian</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {guardians.map(g => (
            <Card key={g.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {g.mode === 'motivator' ? <Heart className="w-6 h-6 text-pink-500" /> : g.mode === 'watcher' ? <Eye className="w-6 h-6 text-purple-500" /> : <Shield className="w-6 h-6 text-blue-500" />}
                  </div>
                  <div>
                    <h3 className="font-semibold">{g.guardian_name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{g.relationship} · {g.mode} mode</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{g.phone}</span>
                      {g.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{g.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColor[g.status] || ''}>{g.status}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(g.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardianLinkPage;
