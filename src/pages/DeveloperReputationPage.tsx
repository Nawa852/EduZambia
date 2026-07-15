import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, TrendingUp, Trophy } from 'lucide-react';

const TIERS = [
  { name: 'Novice', min: 0, color: 'text-slate-500' },
  { name: 'Contributor', min: 100, color: 'text-blue-500' },
  { name: 'Expert', min: 500, color: 'text-purple-500' },
  { name: 'Master', min: 2000, color: 'text-amber-500' },
];

export default function DeveloperReputationPage() {
  const { data: rep } = useQuery({
    queryKey: ['dev-rep'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      const { data } = await supabase.from('developer_reputation').select('*').eq('user_id', user.user.id).maybeSingle();
      return data;
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['dev-subs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('developer_bounty_submissions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const points = rep?.points || 0;
  const tier = TIERS.slice().reverse().find((t) => points >= t.min) || TIERS[0];
  const nextTier = TIERS.find((t) => t.min > points);
  const progress = nextTier ? Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100) : 100;
  const badges = (rep?.badges as any[]) || [];

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Award className="w-5 h-5" /></div>
        <div><h1 className="text-2xl font-bold">Reputation & Badges</h1><p className="text-sm text-muted-foreground">Your standing in the developer community</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Star className="w-8 h-8 text-amber-500" /><div><div className="text-2xl font-bold">{points}</div><div className="text-xs text-muted-foreground">Reputation points</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Trophy className={`w-8 h-8 ${tier.color}`} /><div><div className="text-xl font-bold">{tier.name}</div><div className="text-xs text-muted-foreground">Current tier</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="w-8 h-8 text-emerald-500" /><div><div className="text-2xl font-bold">{submissions.length}</div><div className="text-xs text-muted-foreground">Submissions</div></div></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Tier progress</CardTitle></CardHeader><CardContent>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className={tier.color}>{tier.name}</span>
          {nextTier && <span className="text-muted-foreground">Next: {nextTier.name} ({nextTier.min}pts)</span>}
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Badges</CardTitle></CardHeader><CardContent>
        {badges.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Complete bounties and challenges to earn badges</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map((b: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border text-center">
                <Award className="w-8 h-8 mx-auto text-primary mb-1" />
                <div className="text-sm font-medium">{b.name}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
