import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Trash2, Loader2, UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { listMyFollowing, toggleUserFollow } from '@/lib/community';

interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null };
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { full_name: string | null };
}

const initials = (n?: string | null) => (n || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

export default function SocialFeedPageV2() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<Record<string, Comment[] | null>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followBusy, setFollowBusy] = useState<string | null>(null);


  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('social_posts')
      .select('id,user_id,content,created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data) { setLoading(false); return; }
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id,full_name,avatar_url').in('id', userIds);
    const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const ids = data.map(p => p.id);
    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabase.from('social_reactions').select('post_id,user_id').in('post_id', ids),
      supabase.from('social_comments').select('post_id').in('post_id', ids),
    ]);

    const enriched = data.map(p => ({
      ...p,
      author: profMap.get(p.user_id),
      like_count: (reactions || []).filter((r: any) => r.post_id === p.id).length,
      comment_count: (comments || []).filter((c: any) => c.post_id === p.id).length,
      liked_by_me: !!(reactions || []).find((r: any) => r.post_id === p.id && r.user_id === user?.id),
    }));
    setPosts(enriched as Post[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const submitPost = async () => {
    if (!content.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from('social_posts').insert({ user_id: user.id, content: content.trim() });
    if (error) toast.error('Could not post'); else { setContent(''); toast.success('Posted!'); await load(); }
    setPosting(false);
  };

  const toggleLike = async (post: Post) => {
    if (!user) { setLoading(false); return; }
    if (post.liked_by_me) {
      await supabase.from('social_reactions').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('social_reactions').insert({ post_id: post.id, user_id: user.id, reaction_type: 'like' });
    }
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.like_count + (p.liked_by_me ? -1 : 1) } : p));
  };

  const loadComments = async (postId: string) => {
    if (openComments[postId]) { setOpenComments(o => ({ ...o, [postId]: null })); return; }
    const { data } = await supabase.from('social_comments').select('id,user_id,content,created_at').eq('post_id', postId).order('created_at');
    const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id,full_name').in('id', userIds);
    const m = new Map((profiles || []).map((p: any) => [p.id, p]));
    setOpenComments(o => ({ ...o, [postId]: (data || []).map((c: any) => ({ ...c, author: m.get(c.user_id) })) }));
  };

  const submitComment = async (postId: string) => {
    const txt = (commentDraft[postId] || '').trim();
    if (!txt || !user) return;
    await supabase.from('social_comments').insert({ post_id: postId, user_id: user.id, content: txt });
    setCommentDraft(d => ({ ...d, [postId]: '' }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
    const { data } = await supabase.from('social_comments').select('id,user_id,content,created_at').eq('post_id', postId).order('created_at');
    const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id,full_name').in('id', userIds);
    const m = new Map((profiles || []).map((p: any) => [p.id, p]));
    setOpenComments(o => ({ ...o, [postId]: (data || []).map((c: any) => ({ ...c, author: m.get(c.user_id) })) }));
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('social_posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share something with the community..." rows={3} />
          <div className="flex justify-end">
            <Button onClick={submitPost} disabled={posting || !content.trim()}>
              {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading feed…</div>
      ) : posts.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No posts yet. Be the first!</CardContent></Card>
      ) : posts.map(post => (
        <Card key={post.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10"><AvatarFallback>{initials(post.author?.full_name)}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{post.author?.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                  </div>
                  {post.user_id === user?.id && (
                    <Button size="icon" variant="ghost" onClick={() => deletePost(post.id)}><Trash2 className="w-4 h-4" /></Button>
                  )}
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
            <div className="flex gap-4 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => toggleLike(post)} className={post.liked_by_me ? 'text-red-500' : ''}>
                <Heart className={`w-4 h-4 mr-1 ${post.liked_by_me ? 'fill-current' : ''}`} />{post.like_count}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => loadComments(post.id)}>
                <MessageCircle className="w-4 h-4 mr-1" />{post.comment_count}
              </Button>
            </div>
            {openComments[post.id] !== undefined && openComments[post.id] !== null && (
              <div className="space-y-2 pt-2 border-t">
                {openComments[post.id]!.map(c => (
                  <div key={c.id} className="flex gap-2 text-sm">
                    <Avatar className="w-7 h-7"><AvatarFallback className="text-xs">{initials(c.author?.full_name)}</AvatarFallback></Avatar>
                    <div className="flex-1 bg-muted px-3 py-2 rounded-lg">
                      <p className="font-semibold text-xs">{c.author?.full_name || 'User'}</p>
                      <p>{c.content}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={commentDraft[post.id] || ''} onChange={e => setCommentDraft(d => ({ ...d, [post.id]: e.target.value }))} placeholder="Write a comment..." onKeyDown={e => e.key === 'Enter' && submitComment(post.id)} />
                  <Button size="sm" onClick={() => submitComment(post.id)}><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
