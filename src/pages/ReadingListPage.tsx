import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { BookMarked, Plus, ExternalLink, Trash2, Inbox } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface ReadItem { id: string; title: string; url: string | null; item_type: string; completed: boolean; created_at: string; }

const ReadingListPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ReadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('article');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data, error } = await (supabase as any).from('reading_list').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) { toast.error('Failed to load reading list'); setLoading(false); return; }
      setItems(data || []); setLoading(false);
    })();
  }, [user]);

  const add = async () => {
    if (!title.trim()) return;
    const { data, error } = await (supabase as any).from('reading_list').insert({ user_id: user!.id, title, url: url || null, item_type: type }).select().single();
    if (error) { toast.error('Failed to add item'); return; }
    if (data) setItems([data, ...items]);
    setTitle(''); setUrl(''); setDialogOpen(false); toast.success('Added!');
  };

  const toggleComplete = async (item: ReadItem) => {
    const { error } = await (supabase as any).from('reading_list').update({ completed: !item.completed }).eq('id', item.id);
    if (error) { toast.error('Failed to update'); return; }
    setItems(items.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('reading_list').delete().eq('id', id);
    if (error) { toast.error('Failed to remove'); return; }
    setItems(items.filter(i => i.id !== id)); toast.success('Removed');
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
    </div>
  );

  const pending = items.filter(i => !i.completed);
  const done = items.filter(i => i.completed);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookMarked className="w-6 h-6 text-primary" /> Reading List</h1>
          <p className="text-sm text-muted-foreground">{pending.length} to read · {done.length} completed</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add to Reading List</DialogTitle></DialogHeader>
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <Input placeholder="URL (optional)" value={url} onChange={e => setUrl(e.target.value)} />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="book">Book</SelectItem>
                <SelectItem value="paper">Paper</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={add}>Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-medium">Nothing saved yet</p>
          <p className="text-sm text-muted-foreground mt-1">Save articles, videos, and resources for later.</p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add your first item</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {[...pending, ...done].map(item => (
            <Card key={item.id} className={`border-border/50 ${item.completed ? 'opacity-60' : ''}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox checked={item.completed} onCheckedChange={() => toggleComplete(item)} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${item.completed ? 'line-through' : ''}`}>{item.title}</p>
                  <Badge variant="outline" className="text-[10px]">{item.item_type}</Badge>
                </div>
                <div className="flex gap-1">
                  {item.url && <Button variant="ghost" size="icon" className="h-7 w-7" asChild><a href={item.url} target="_blank" rel="noopener"><ExternalLink className="w-3.5 h-3.5" /></a></Button>}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingListPage;
