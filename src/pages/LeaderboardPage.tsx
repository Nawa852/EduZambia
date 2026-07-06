import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Trophy, Medal, Star, Flame, Crown, Zap, Users } from 'lucide-react';
import { LogoLoader } from '@/components/UI/LogoLoader';

interface LeaderboardEntry {
  user_id: string;
  xp: number;
  level: number;
  current_streak: number;
  total_focus_minutes: number;
  full_name: string | null;
  avatar_url: string | null;
  school: string | null;
}

const RANK_ICONS = [
  <Crown className="w-5 h-5 text-yellow-500" />,
  <Medal className="w-5 h-5 text-gray-400" />,
  <Medal className="w-5 h-5 text-amber-700" />,
];

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'xp' | 'streak' | 'focus'>('xp');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data: statsData } = await (supabase.from('leaderboard_view' as any) as any)
        .select('user_id, xp, level, current_streak, total_focus_minutes')
        .order(sortBy === 'xp' ? 'xp' : sortBy === 'streak' ? 'current_streak' : 'total_focus_minutes', { ascending: false })
        .limit(50);

      if (!statsData || statsData.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const userIds = statsData.map((s: any) => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, school')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      setEntries(statsData.map((s: any) => ({
        ...s,
        full_name: profileMap.get(s.user_id)?.full_name || 'Anonymous',
        avatar_url: profileMap.get(s.user_id)?.avatar_url,
        school: profileMap.get(s.user_id)?.school,
      })));
      setLoading(false);
    };

    fetchLeaderboard();
  }, [sortBy]);

  if (loading) return <LogoLoader text="Loading leaderboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" /> Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">Top learners across Edu Zambia</p>
      </div>

      <Tabs defaultValue="xp" onValueChange={(v) => setSortBy(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="xp"><Zap className="w-4 h-4 mr-2" />XP</TabsTrigger>
          <TabsTrigger value="streak"><Flame className="w-4 h-4 mr-2" />Streak</TabsTrigger>
          <TabsTrigger value="focus"><Star className="w-4 h-4 mr-2" />Focus Time</TabsTrigger>
        </TabsList>

        {['xp', 'streak', 'focus'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                {entries.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No data yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {entries.map((entry, i) => {
                      const isMe = entry.user_id === user?.id;
                      const value = tab === 'xp' ? `${entry.xp} XP` :
                                    tab === 'streak' ? `${entry.current_streak} days` :
                                    `${Math.floor(entry.total_focus_minutes / 60)}h ${entry.total_focus_minutes % 60}m`;

                      return (
                        <div
                          key={entry.user_id}
                          className={`flex items-center gap-4 p-4 ${isMe ? 'bg-primary/5' : ''}`}
                        >
                          <div className="w-8 text-center font-bold text-muted-foreground">
                            {i < 3 ? RANK_ICONS[i] : <span>#{i + 1}</span>}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                            ) : (
                              entry.full_name?.charAt(0)?.toUpperCase() || '?'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {entry.full_name} {isMe && <Badge variant="secondary" className="ml-1 text-[10px]">You</Badge>}
                            </p>
                            {entry.school && (
                              <p className="text-xs text-muted-foreground truncate">{entry.school}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-foreground">{value}</p>
                            <p className="text-xs text-muted-foreground">Lv. {entry.level}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LeaderboardPage;
