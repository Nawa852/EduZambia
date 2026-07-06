import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  total_focus_minutes: number;
  xp: number;
  current_streak: number;
  level: number;
}

export const StudyLeaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await (supabase.from('leaderboard_view' as any) as any)
        .select('user_id, xp, total_focus_minutes, current_streak, level')
        .order('xp', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const userIds = data.map((d: any) => d.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);
        setEntries(
          data.map((d: any) => ({
            ...d,
            full_name: profileMap.get(d.user_id) || 'Learner',
          }))
        );
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Tabs defaultValue="xp">
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="xp" className="text-xs">XP</TabsTrigger>
            <TabsTrigger value="focus" className="text-xs">Focus</TabsTrigger>
            <TabsTrigger value="streak" className="text-xs">Streak</TabsTrigger>
          </TabsList>
          {['xp', 'focus', 'streak'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-3 space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
              ) : entries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
              ) : (
                [...entries]
                  .sort((a, b) =>
                    tab === 'focus'
                      ? b.total_focus_minutes - a.total_focus_minutes
                      : tab === 'streak'
                      ? b.current_streak - a.current_streak
                      : b.xp - a.xp
                  )
                  .map((entry, i) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        entry.user_id === user?.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <span className="text-sm w-6 text-center font-bold">
                        {i < 3 ? medals[i] : `#${i + 1}`}
                      </span>
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {entry.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">Level {entry.level}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {tab === 'focus' ? (
                          <><Clock className="w-3 h-3 mr-1" />{entry.total_focus_minutes}m</>
                        ) : tab === 'streak' ? (
                          <><Flame className="w-3 h-3 mr-1" />{entry.current_streak}d</>
                        ) : (
                          <>{entry.xp} XP</>
                        )}
                      </Badge>
                    </div>
                  ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
