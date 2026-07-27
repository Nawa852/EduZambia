import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark, BookOpen, FileText, Trash2, ExternalLink, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface BookmarkItem { id: string; item_type: string; item_id: string; created_at: string; title?: string; }

const BookmarksPage = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data, error } = await (supabase as any).from('bookmarks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) { toast.error('Failed to load bookmarks'); setLoading(false); return; }
      if (data) {
        const courseIds = data.filter((b: any) => b.item_type === 'course').map((b: any) => b.item_id);
        const lessonIds = data.filter((b: any) => b.item_type === 'lesson').map((b: any) => b.item_id);
        const [{ data: courses }, { data: lessons }] = await Promise.all([
          courseIds.length ? supabase.from('courses').select('id, title').in('id', courseIds) : { data: [] as any[] },
          lessonIds.length ? supabase.from('lessons').select('id, title').in('id', lessonIds) : { data: [] as any[] },
        ]);
        const titleMap: Record<string, string> = {};
        (courses || []).forEach((c: any) => { titleMap[c.id] = c.title; });
        (lessons || []).forEach((l: any) => { titleMap[l.id] = l.title; });
        setBookmarks(data.map((b: any) => ({ ...b, title: titleMap[b.item_id] || b.item_id })));
      }
      setLoading(false);
    })();
  }, [user]);

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('bookmarks').delete().eq('id', id);
    if (error) { toast.error('Failed to remove bookmark'); return; }
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast.success('Bookmark removed');
  };

  const types = ['all', 'course', 'lesson', 'past_paper', 'resource'];
  const filtered = (type: string) => type === 'all' ? bookmarks : bookmarks.filter(b => b.item_type === type);

  if (loading) return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-primary" /> My Bookmarks
        </h1>
        <p className="text-sm text-muted-foreground">{bookmarks.length} items saved</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {types.map(t => <TabsTrigger key={t} value={t} className="capitalize">{t === 'past_paper' ? 'Past Papers' : t === 'all' ? 'All' : t + 's'}</TabsTrigger>)}
        </TabsList>
        {types.map(t => (
          <TabsContent key={t} value={t} className="space-y-3 mt-4">
            {filtered(t).length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <Inbox className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm">No bookmarks yet</p>
                <Button variant="outline" size="sm" className="mt-3" asChild><Link to="/courses">Browse Courses</Link></Button>
              </CardContent></Card>
            ) : filtered(t).map(bm => (
              <Card key={bm.id} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {bm.item_type === 'course' ? <BookOpen className="w-4 h-4 text-primary shrink-0" /> : <FileText className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{bm.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{bm.item_type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(bm.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {bm.item_type === 'course' && <Button variant="ghost" size="icon" className="h-7 w-7" asChild><Link to={`/course/${bm.item_id}`}><ExternalLink className="w-3.5 h-3.5" /></Link></Button>}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(bm.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default BookmarksPage;
