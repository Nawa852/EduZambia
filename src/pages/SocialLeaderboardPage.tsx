import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Flame, Zap, Crown, Medal, Heart, MessageCircle, Send, Star, BookOpen, Target, Share2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { LogoLoader } from '@/components/UI/LogoLoader';

interface LeaderEntry {
  user_id: string;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  total_focus_minutes: number;
  total_lessons_completed: number;
  total_quizzes_passed: number;
  full_name: string | null;
  school: string | null;
}

interface FeedPost {
  id: string;
  author: string;
  initials: string;
  content: string;
  type: 'achievement' | 'streak' | 'milestone' | 'general';
  icon: React.ReactNode;
  time: string;
  likes: number;
  liked: boolean;
}

const RANK_COLORS = ['from-yellow-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-amber-600 to-amber-700'];

const SocialLeaderboardPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'xp' | 'streak' | 'focus'>('xp');
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  useEffect(() => {
    generateFeed();
  }, [entries]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const orderCol = sortBy === 'xp' ? 'xp' : sortBy === 'streak' ? 'current_streak' : 'total_focus_minutes';
    const { data: stats } = await (supabase.from('leaderboard_view' as any) as any)
      .select('user_id, xp, level, current_streak, longest_streak, total_focus_minutes, total_lessons_completed, total_quizzes_passed')
      .order(orderCol, { ascending: false })
      .limit(50);

    if (!stats?.length) { setEntries([]); setLoading(false); return; }

    const ids = stats.map((s: any) => s.user_id);
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, school').in('id', ids);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const merged = stats.map((s: any) => ({
      ...s,
      full_name: profileMap.get(s.user_id)?.full_name || 'Student',
      school: profileMap.get(s.user_id)?.school || null,
    }));
    setEntries(merged);

    const idx = merged.findIndex((e: LeaderEntry) => e.user_id === user?.id);
    setMyRank(idx >= 0 ? idx + 1 : null);
    setLoading(false);
  };

  const generateFeed = () => {
    const feed: FeedPost[] = [];
    entries.slice(0, 10).forEach((e, i) => {
      if (e.current_streak >= 7) {
        feed.push({
          id: `streak-${e.user_id}`, author: e.full_name || 'Student', initials: (e.full_name || 'S').slice(0, 2).toUpperCase(),
          content: `🔥 ${e.full_name} is on a ${e.current_streak}-day study streak! Keep it up!`,
          type: 'streak', icon: <Flame className="w-4 h-4 text-orange-500" />,
          time: 'Today', likes: Math.floor(Math.random() * 30) + 5, liked: false,
        });
      }
      if (e.total_lessons_completed >= 10 && i < 5) {
        feed.push({
          id: `milestone-${e.user_id}`, author: e.full_name || 'Student', initials: (e.full_name || 'S').slice(0, 2).toUpperCase(),
          content: `📚 ${e.full_name} completed ${e.total_lessons_completed} lessons! Incredible dedication!`,
          type: 'milestone', icon: <BookOpen className="w-4 h-4 text-blue-500" />,
          time: 'Recently', likes: Math.floor(Math.random() * 20) + 3, liked: false,
        });
      }
      if (i < 3) {
        feed.push({
          id: `top-${e.user_id}`, author: e.full_name || 'Student', initials: (e.full_name || 'S').slice(0, 2).toUpperCase(),
          content: `🏆 ${e.full_name} is ranked #${i + 1} with ${e.xp.toLocaleString()} XP! Amazing performance!`,
          type: 'achievement', icon: <Trophy className="w-4 h-4 text-yellow-500" />,
          time: 'Now', likes: Math.floor(Math.random() * 50) + 10, liked: false,
        });
      }
    });
    setPosts(feed.sort(() => Math.random() - 0.5));
  };

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const sharePost = () => {
    if (!newPost.trim()) return;
    const post: FeedPost = {
      id: `user-${Date.now()}`, author: profile?.full_name || 'You', initials: (profile?.full_name || 'Y').slice(0, 2).toUpperCase(),
      content: newPost, type: 'general', icon: <Star className="w-4 h-4 text-primary" />,
      time: 'Just now', likes: 0, liked: false,
    };
    setPosts([post, ...posts]);
    setNewPost('');
    toast.success('Posted!');
  };

  if (loading) return <div className="flex justify-center py-12"><LogoLoader /></div>;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leaderboard"><Trophy className="w-4 h-4 mr-1" /> Leaderboard</TabsTrigger>
          <TabsTrigger value="feed"><TrendingUp className="w-4 h-4 mr-1" /> Social Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-3 mt-3">
          {/* Sort Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'xp' as const, label: 'XP', icon: <Zap className="w-3 h-3" /> },
              { key: 'streak' as const, label: 'Streaks', icon: <Flame className="w-3 h-3" /> },
              { key: 'focus' as const, label: 'Focus', icon: <Target className="w-3 h-3" /> },
            ].map(s => (
              <Button key={s.key} variant={sortBy === s.key ? 'default' : 'outline'} size="sm" onClick={() => setSortBy(s.key)}>
                {s.icon} <span className="ml-1">{s.label}</span>
              </Button>
            ))}
          </div>

          {/* My Rank */}
          {myRank && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary">#{myRank}</Badge>
                  <span className="text-sm font-medium">Your Rank</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {entries.find(e => e.user_id === user?.id)?.xp?.toLocaleString() || 0} XP
                </span>
              </CardContent>
            </Card>
          )}

          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-2">
            {entries.slice(0, 3).map((e, i) => {
              const order = [1, 0, 2];
              const entry = entries[order[i]];
              if (!entry) return null;
              const rank = order[i] + 1;
              return (
                <Card key={entry.user_id} className={`text-center ${rank === 1 ? 'ring-2 ring-yellow-400/50' : ''}`}>
                  <CardContent className="py-3 space-y-1">
                    <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${RANK_COLORS[rank - 1]} flex items-center justify-center text-white font-bold text-sm`}>
                      {rank === 1 ? <Crown className="w-5 h-5" /> : rank}
                    </div>
                    <p className="text-xs font-medium truncate">{entry.full_name}</p>
                    <p className="text-xs text-muted-foreground">{entry.xp.toLocaleString()} XP</p>
                    <Badge variant="outline" className="text-[10px]">Lv.{entry.level}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Full List */}
          <div className="space-y-1">
            {entries.slice(3).map((e, i) => (
              <div key={e.user_id} className={`flex items-center gap-3 p-2 rounded-lg ${e.user_id === user?.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/50'}`}>
                <span className="text-xs font-medium text-muted-foreground w-6 text-right">{i + 4}</span>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">{(e.full_name || 'S').slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.full_name}</p>
                  {e.school && <p className="text-[10px] text-muted-foreground truncate">{e.school}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {sortBy === 'xp' ? `${e.xp.toLocaleString()} XP` : sortBy === 'streak' ? `${e.current_streak}d` : `${e.total_focus_minutes}m`}
                  </p>
                  <Badge variant="outline" className="text-[10px]">Lv.{e.level}</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feed" className="space-y-3 mt-3">
          {/* Create Post */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <Textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share an achievement or study update..." className="resize-none" rows={2} />
              <div className="flex justify-end">
                <Button size="sm" onClick={sharePost} disabled={!newPost.trim()}>
                  <Send className="w-3 h-3 mr-1" /> Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feed */}
          {posts.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/30 to-primary/10">{p.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{p.author}</span>
                      {p.icon}
                      <span className="text-[10px] text-muted-foreground ml-auto">{p.time}</span>
                    </div>
                    <p className="text-sm mt-1">{p.content}</p>
                    <div className="flex gap-4 mt-2">
                      <button onClick={() => toggleLike(p.id)} className={`flex items-center gap-1 text-xs ${p.liked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500 transition-colors`}>
                        <Heart className={`w-3.5 h-3.5 ${p.liked ? 'fill-red-500' : ''}`} /> {p.likes}
                      </button>
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" /> Reply
                      </button>
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Share2 className="w-3.5 h-3.5" /> Share
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No activity yet. Be the first to post!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialLeaderboardPage;
