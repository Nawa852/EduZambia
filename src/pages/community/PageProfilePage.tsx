import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BadgeCheck, Globe, Loader2, Settings, Trash2, Users, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/Auth/AuthProvider';
import {
  CommunityPage, PagePost, createPagePost, deletePagePost, getPageByHandle,
  isFollowingPage, listPagePosts, togglePageFollow, updatePage,
} from '@/lib/community';
import { EmptyState } from '@/components/UI/EmptyState';

const PageProfilePage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();
  const [page, setPage] = useState<CommunityPage | null>(null);
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [edit, setEdit] = useState({ name: '', bio: '', location: '', website_url: '', youtube_url: '' });
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    if (!handle) return;
    setLoading(true);
    try {
      const p = await getPageByHandle(handle);
      setPage(p);
      if (p) {
        setEdit({ name: p.name, bio: p.bio ?? '', location: p.location ?? '', website_url: p.website_url ?? '', youtube_url: p.youtube_url ?? '' });
        const [ps, f] = await Promise.all([listPagePosts(p.id), isFollowingPage(p.id)]);
        setPosts(ps);
        setFollowing(f);
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Could not load page');
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => { load(); }, [load]);

  const isOwner = !!page && page.owner_id === user?.id;

  const follow = async () => {
    if (!page) return;
    try {
      await togglePageFollow(page.id, following);
      setFollowing(!following);
      setPage({ ...page, follower_count: page.follower_count + (following ? -1 : 1) });
    } catch (e: any) { toast.error(e.message); }
  };

  const publish = async () => {
    if (!page || !draft.trim()) return;
    setPosting(true);
    try {
      await createPagePost(page.id, { content: draft });
      setDraft('');
      setPosts(await listPagePosts(page.id));
      toast.success('Published — followers notified');
    } catch (e: any) { toast.error(e.message); } finally { setPosting(false); }
  };

  const saveProfile = async () => {
    if (!page) return;
    try {
      await updatePage(page.id, edit as never);
      setPage({ ...page, ...edit } as CommunityPage);
      setEditOpen(false);
      toast.success('Page updated');
    } catch (e: any) { toast.error(e.message); }
  };

  const removePost = async (id: string) => {
    await deletePagePost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!page) return <EmptyState title="Page not found" description="This page may have been removed or unpublished." />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-primary/30 via-primary/15 to-accent/30" />
        <CardContent className="p-4 -mt-10">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div className="flex items-end gap-3">
              <Avatar className="h-16 w-16 border-4 border-background">
                <AvatarImage src={page.avatar_url ?? undefined} alt={page.name} />
                <AvatarFallback>{page.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-bold flex items-center gap-1">{page.name}{page.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}</h1>
                <p className="text-xs text-muted-foreground">@{page.handle} · {page.page_type}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isOwner ? (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild><Button size="sm" variant="outline"><Settings className="h-4 w-4 mr-1" />Manage</Button></DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Update page profile</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Name</Label><Input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
                      <div><Label>Bio</Label><Textarea rows={3} value={edit.bio} onChange={e => setEdit({ ...edit, bio: e.target.value })} /></div>
                      <div><Label>Location</Label><Input value={edit.location} onChange={e => setEdit({ ...edit, location: e.target.value })} /></div>
                      <div><Label>Website</Label><Input value={edit.website_url} onChange={e => setEdit({ ...edit, website_url: e.target.value })} /></div>
                      <div><Label>YouTube</Label><Input value={edit.youtube_url} onChange={e => setEdit({ ...edit, youtube_url: e.target.value })} /></div>
                      <Button className="w-full" onClick={saveProfile}>Save changes</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button size="sm" variant={following ? 'outline' : 'default'} onClick={follow}>{following ? 'Following' : 'Follow'}</Button>
              )}
            </div>
          </div>
          {page.bio && <p className="text-sm text-muted-foreground mt-3">{page.bio}</p>}
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap items-center">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{page.follower_count} followers</span>
            {page.location && <span>{page.location}</span>}
            {page.website_url && <a className="flex items-center gap-1 hover:text-primary" href={page.website_url} target="_blank" rel="noreferrer"><Globe className="h-3 w-3" />Website</a>}
            {page.youtube_url && <a className="flex items-center gap-1 hover:text-primary" href={page.youtube_url} target="_blank" rel="noreferrer"><Youtube className="h-3 w-3" />YouTube</a>}
            {page.subjects?.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Textarea rows={3} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Share an update, lesson or resource with your followers..." />
            <div className="flex justify-end">
              <Button onClick={publish} disabled={posting || !draft.trim()}>{posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Publish</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <EmptyState title="No posts yet" description={isOwner ? 'Publish your first update above.' : 'This page has not posted yet.'} />
      ) : posts.map(p => (
        <Card key={p.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
              {isOwner && <Button size="icon" variant="ghost" onClick={() => removePost(p.id)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
            <p className="text-sm whitespace-pre-wrap mt-1">{p.content}</p>
            {p.link_url && <a className="text-xs text-primary" href={p.link_url} target="_blank" rel="noreferrer">{p.link_url}</a>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PageProfilePage;
