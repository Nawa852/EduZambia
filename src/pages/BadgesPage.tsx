import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Award, Lock, Check, Zap } from 'lucide-react';
import { LogoLoader } from '@/components/UI/LogoLoader';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
  earned: boolean;
  earned_at?: string;
}

const BadgesPage = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchBadges = async () => {
      const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
        (supabase.from('badges') as any).select('*').order('category').order('condition_value'),
        (supabase.from('user_badges') as any).select('badge_id, earned_at').eq('user_id', user.id),
      ]);

      const earnedMap = new Map((userBadges || []).map((ub: any) => [ub.badge_id, ub.earned_at]));

      setBadges((allBadges || []).map((b: any) => ({
        ...b,
        earned: earnedMap.has(b.id),
        earned_at: earnedMap.get(b.id),
      })));
      setLoading(false);
    };
    fetchBadges();
  }, [user]);

  if (loading) return <LogoLoader text="Loading badges..." />;

  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);
  const categories = [...new Set(badges.map(b => b.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Award className="w-8 h-8 text-yellow-500" /> Badges & Achievements
        </h1>
        <p className="text-muted-foreground mt-1">
          {earned.length}/{badges.length} badges earned
        </p>
      </div>

      {/* Earned Badges */}
      {earned.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" /> Earned ({earned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {earned.map(b => (
                <div key={b.id} className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <span className="text-4xl">{b.icon}</span>
                  <p className="font-semibold text-sm mt-2">{b.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.description}</p>
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    <Zap className="w-3 h-3 mr-1" />+{b.xp_reward} XP
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Badges by Category */}
      {categories.map(cat => {
        const catBadges = locked.filter(b => b.category === cat);
        if (catBadges.length === 0) return null;
        return (
          <Card key={cat}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base capitalize flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" /> {cat} ({catBadges.length} locked)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {catBadges.map(b => (
                  <div key={b.id} className="text-center p-4 rounded-xl bg-muted/30 border border-border opacity-60">
                    <span className="text-4xl grayscale">{b.icon}</span>
                    <p className="font-semibold text-sm mt-2">{b.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{b.description}</p>
                    <Badge variant="outline" className="mt-2 text-[10px]">
                      <Zap className="w-3 h-3 mr-1" />+{b.xp_reward} XP
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BadgesPage;
