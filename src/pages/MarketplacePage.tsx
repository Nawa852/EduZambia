import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Store, Trash2, Send, Briefcase, Inbox } from 'lucide-react';
import { toast } from 'sonner';

interface Service { id: string; user_id: string; title: string; description: string | null; category: string | null; price_zmw: number; delivery_days: number | null; status: string; }
interface Order { id: string; service_id: string; buyer_id: string; seller_id: string; status: string; message: string | null; created_at: string; service?: Service; }

const CATS = ['Tutoring', 'Design', 'Writing', 'Coding', 'Translation', 'Photography', 'Music', 'Other'];

export default function MarketplacePage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [incoming, setIncoming] = useState<Order[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', price_zmw: 0, delivery_days: 3 });
  const [orderTarget, setOrderTarget] = useState<Service | null>(null);
  const [orderMsg, setOrderMsg] = useState('');

  const load = async () => {
    const { data: s } = await supabase.from('marketplace_services').select('*').eq('status', 'active').order('created_at', { ascending: false });
    setServices((s as Service[]) || []);
    if (user) {
      const { data: o1 } = await supabase.from('service_orders').select('*, service:marketplace_services(*)').eq('buyer_id', user.id).order('created_at', { ascending: false });
      const { data: o2 } = await supabase.from('service_orders').select('*, service:marketplace_services(*)').eq('seller_id', user.id).order('created_at', { ascending: false });
      setMyOrders((o1 as Order[]) || []); setIncoming((o2 as Order[]) || []);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const create = async () => {
    if (!form.title || !user) return;
    const { error } = await supabase.from('marketplace_services').insert({ ...form, user_id: user.id });
    if (error) toast.error('Failed'); else { toast.success('Service listed'); setOpen(false); setForm({ title: '', description: '', category: '', price_zmw: 0, delivery_days: 3 }); load(); }
  };

  const placeOrder = async () => {
    if (!orderTarget || !user) return;
    const { error } = await supabase.from('service_orders').insert({ service_id: orderTarget.id, buyer_id: user.id, seller_id: orderTarget.user_id, message: orderMsg });
    if (error) toast.error('Failed'); else { toast.success('Order placed!'); setOrderTarget(null); setOrderMsg(''); load(); }
  };

  const updateOrder = async (id: string, status: string) => {
    await supabase.from('service_orders').update({ status }).eq('id', id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remove listing?')) return;
    await supabase.from('marketplace_services').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Store className="w-6 h-6" />Student Marketplace</h2>
          <p className="text-sm text-muted-foreground">Offer your skills or hire fellow students</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />List Service</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>List a New Service</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Service title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Textarea placeholder="Describe what you offer..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Price ZMW" value={form.price_zmw || ''} onChange={e => setForm(f => ({ ...f, price_zmw: Number(e.target.value) }))} />
                <Input type="number" placeholder="Delivery days" value={form.delivery_days || ''} onChange={e => setForm(f => ({ ...f, delivery_days: Number(e.target.value) }))} />
              </div>
              <Button className="w-full" onClick={create}>Publish</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse"><Store className="w-4 h-4 mr-1" />Browse</TabsTrigger>
          <TabsTrigger value="my-orders"><Briefcase className="w-4 h-4 mr-1" />My Orders</TabsTrigger>
          <TabsTrigger value="incoming"><Inbox className="w-4 h-4 mr-1" />Incoming</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.length === 0 ? <p className="col-span-full text-center text-muted-foreground py-8">No services yet</p> : services.map(s => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                  {s.user_id === user?.id && <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4" /></Button>}
                </div>
                {s.category && <Badge variant="secondary">{s.category}</Badge>}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{s.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold">ZMW {s.price_zmw.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{s.delivery_days}d delivery</span>
                </div>
                {s.user_id !== user?.id && <Button size="sm" className="w-full" onClick={() => setOrderTarget(s)}><Send className="w-4 h-4 mr-1" />Order</Button>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="my-orders" className="space-y-2">
          {myOrders.length === 0 ? <p className="text-center text-muted-foreground py-8">No orders yet</p> : myOrders.map(o => (
            <Card key={o.id}><CardContent className="p-4 flex justify-between items-center">
              <div><p className="font-medium">{o.service?.title}</p><p className="text-xs text-muted-foreground">{o.message}</p></div>
              <Badge>{o.status}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="incoming" className="space-y-2">
          {incoming.length === 0 ? <p className="text-center text-muted-foreground py-8">No incoming orders</p> : incoming.map(o => (
            <Card key={o.id}><CardContent className="p-4 space-y-2">
              <div className="flex justify-between"><p className="font-medium">{o.service?.title}</p><Badge>{o.status}</Badge></div>
              <p className="text-sm text-muted-foreground">{o.message}</p>
              {o.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateOrder(o.id, 'accepted')}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => updateOrder(o.id, 'declined')}>Decline</Button>
                </div>
              )}
              {o.status === 'accepted' && <Button size="sm" onClick={() => updateOrder(o.id, 'completed')}>Mark Complete</Button>}
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!orderTarget} onOpenChange={o => !o && setOrderTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order: {orderTarget?.title}</DialogTitle></DialogHeader>
          <Textarea placeholder="Message to seller (requirements, deadline...)" value={orderMsg} onChange={e => setOrderMsg(e.target.value)} />
          <Button onClick={placeOrder}>Place Order (ZMW {orderTarget?.price_zmw.toLocaleString()})</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
