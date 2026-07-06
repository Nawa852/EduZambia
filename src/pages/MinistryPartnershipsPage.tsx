import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Plus, Trash2, Building2, DollarSign, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';

interface Partnership {
  id: string;
  ngo_name: string;
  program_name: string;
  focus_area: string | null;
  province: string | null;
  funding_amount: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  contact_email: string | null;
  notes: string | null;
}

const MinistryPartnershipsPage = () => {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    ngo_name: '', program_name: '', focus_area: '', province: '', funding_amount: '', status: 'active', contact_email: '', notes: '',
  });

  const fetchPartnerships = async () => {
    const { data } = await supabase.from('ngo_partnerships').select('id, ngo_name, program_name, focus_area, province, funding_amount, start_date, end_date, status, notes, created_by, created_at, updated_at').order('created_at', { ascending: false });
    if (data) setPartnerships(data as unknown as Partnership[]);
    setLoading(false);
  };

  useEffect(() => { fetchPartnerships(); }, []);

  const handleCreate = async () => {
    if (!form.ngo_name || !form.program_name || !user) return;
    const { error } = await supabase.from('ngo_partnerships').insert({
      ngo_name: form.ngo_name,
      program_name: form.program_name,
      focus_area: form.focus_area || null,
      province: form.province || null,
      funding_amount: parseFloat(form.funding_amount) || 0,
      status: form.status,
      contact_email: form.contact_email || null,
      notes: form.notes || null,
      created_by: user.id,
    } as any);
    if (error) { toast.error('Failed to create partnership'); return; }
    toast.success('Partnership added');
    setForm({ ngo_name: '', program_name: '', focus_area: '', province: '', funding_amount: '', status: 'active', contact_email: '', notes: '' });
    setOpen(false);
    fetchPartnerships();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('ngo_partnerships').delete().eq('id', id);
    toast.success('Partnership removed');
    fetchPartnerships();
  };

  const totalFunding = partnerships.reduce((a, p) => a + (p.funding_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            NGO Partnerships
          </h1>
          <p className="text-muted-foreground mt-1">Track NGO programs, funding & impact</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Partnership</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New NGO Partnership</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="NGO Name" value={form.ngo_name} onChange={e => setForm(f => ({ ...f, ngo_name: e.target.value }))} />
              <Input placeholder="Program Name" value={form.program_name} onChange={e => setForm(f => ({ ...f, program_name: e.target.value }))} />
              <Input placeholder="Focus Area (e.g. Education, Health)" value={form.focus_area} onChange={e => setForm(f => ({ ...f, focus_area: e.target.value }))} />
              <Input placeholder="Province" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} />
              <Input placeholder="Funding Amount (ZMW)" type="number" value={form.funding_amount} onChange={e => setForm(f => ({ ...f, funding_amount: e.target.value }))} />
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Contact Email" type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
              <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button onClick={handleCreate} className="w-full">Add Partnership</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6 text-center">
            <Building2 className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold">{partnerships.length}</p>
            <p className="text-sm text-muted-foreground">Total Partnerships</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg">
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-3xl font-bold">K{totalFunding.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Funding</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg">
          <CardContent className="p-6 text-center">
            <MapPin className="h-8 w-8 mx-auto text-accent mb-2" />
            <p className="text-3xl font-bold">{new Set(partnerships.map(p => p.province).filter(Boolean)).size}</p>
            <p className="text-sm text-muted-foreground">Provinces Covered</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading partnerships...</p>
      ) : partnerships.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">No partnerships yet. Click "Add Partnership" to get started.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {partnerships.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-none shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{p.ngo_name}</h3>
                      <p className="text-sm text-muted-foreground">{p.program_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.status === 'active' ? 'default' : p.status === 'completed' ? 'secondary' : 'outline'}>{p.status}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {p.focus_area && <div className="bg-muted/30 rounded p-2"><span className="text-xs text-muted-foreground">Focus</span><p className="font-medium">{p.focus_area}</p></div>}
                    {p.province && <div className="bg-muted/30 rounded p-2"><span className="text-xs text-muted-foreground">Province</span><p className="font-medium">{p.province}</p></div>}
                    <div className="bg-muted/30 rounded p-2"><span className="text-xs text-muted-foreground">Funding</span><p className="font-medium">K{p.funding_amount.toLocaleString()}</p></div>
                    {p.contact_email && <div className="bg-muted/30 rounded p-2"><span className="text-xs text-muted-foreground">Contact</span><p className="font-medium truncate">{p.contact_email}</p></div>}
                  </div>
                  {p.notes && <p className="text-xs text-muted-foreground mt-3">{p.notes}</p>}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MinistryPartnershipsPage;
