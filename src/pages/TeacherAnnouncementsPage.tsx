import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, Plus, Trash2, Inbox, AlertTriangle, Info, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const priorityConfig = {
  urgent: { variant: 'destructive' as const, icon: AlertTriangle, label: 'Urgent' },
  important: { variant: 'default' as const, icon: Info, label: 'Important' },
  normal: { variant: 'outline' as const, icon: Clock, label: 'Normal' },
};

const TeacherAnnouncementsPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data: c, error: cErr } = await supabase.from('courses').select('id, title').eq('created_by', user.id);
      if (cErr) { toast.error('Failed to load courses'); setLoading(false); return; }
      setCourses(c || []);
      const { data: a, error: aErr } = await (supabase as any).from('class_announcements').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false });
      if (aErr) { toast.error('Failed to load announcements'); setLoading(false); return; }
      if (a && c) {
        const cMap = Object.fromEntries((c || []).map((x: any) => [x.id, x.title]));
        setAnnouncements(a.map((x: any) => ({ ...x, course_title: cMap[x.course_id] })));
      }
      setLoading(false);
    })();
  }, [user]);

  const post = async () => {
    if (!title.trim() || !courseId) return;
    const { data, error } = await (supabase as any).from('class_announcements').insert({ course_id: courseId, teacher_id: user!.id, title, content, priority }).select().single();
    if (error) { toast.error('Failed to post announcement'); return; }
    if (data) {
      const cTitle = courses.find(c => c.id === courseId)?.title;
      setAnnouncements([{ ...data, course_title: cTitle }, ...announcements]);
    }
    setTitle(''); setContent(''); setDialogOpen(false); toast.success('Announcement posted!');
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('class_announcements').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setAnnouncements(announcements.filter(a => a.id !== id)); toast.success('Deleted');
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Post updates and alerts to your classes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Course</label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
                <Input placeholder="Announcement title" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Content (optional)</label>
                <Textarea placeholder="Additional details..." value={content} onChange={e => setContent(e.target.value)} rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={post} className="w-full" disabled={!title.trim() || !courseId}>Post Announcement</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {announcements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Inbox className="w-14 h-14 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No announcements</h3>
            <p className="text-sm text-muted-foreground">Post your first announcement to a class</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const config = priorityConfig[a.priority as keyof typeof priorityConfig] || priorityConfig.normal;
            const PriorityIcon = config.icon;
            return (
              <Card key={a.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        a.priority === 'urgent' ? 'bg-destructive/10' : a.priority === 'important' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <PriorityIcon className={`w-4 h-4 ${
                          a.priority === 'urgent' ? 'text-destructive' : a.priority === 'important' ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{a.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px]">{a.course_title}</Badge>
                          <Badge variant={config.variant} className="text-[10px]">{config.label}</Badge>
                        </div>
                        {a.content && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.content}</p>}
                        <p className="text-[10px] text-muted-foreground/60 mt-2">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => remove(a.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherAnnouncementsPage;
