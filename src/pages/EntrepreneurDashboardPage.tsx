import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useVentures } from '@/hooks/useVentures';
import ContinueLearning from '@/components/Courses/ContinueLearning';
import {
  Rocket, DollarSign, Target, TrendingUp, Lightbulb, FileText, Presentation,
  Search, Store, Users, BookOpen, ArrowRight, PiggyBank, CheckCircle2,
} from 'lucide-react';

const quickActions = [
  { label: 'New venture', icon: Rocket, to: '/entrepreneur?tab=ventures', color: 'from-blue-500 to-indigo-500' },
  { label: 'Business plan', icon: FileText, to: '/entrepreneur?tab=business-plan', color: 'from-emerald-500 to-teal-500' },
  { label: 'Pitch deck', icon: Presentation, to: '/entrepreneur?tab=pitch-deck', color: 'from-purple-500 to-pink-500' },
  { label: 'Find funding', icon: DollarSign, to: '/entrepreneur?tab=funding', color: 'from-amber-500 to-orange-500' },
  { label: 'Market research', icon: Search, to: '/entrepreneur?tab=market-research', color: 'from-cyan-500 to-blue-500' },
  { label: 'Marketplace', icon: Store, to: '/entrepreneur?tab=marketplace', color: 'from-rose-500 to-red-500' },
  { label: 'Mentors', icon: Users, to: '/entrepreneur?tab=mentors', color: 'from-violet-500 to-purple-500' },
  { label: 'Financials', icon: PiggyBank, to: '/entrepreneur?tab=financials', color: 'from-green-500 to-emerald-500' },
];

const tipsOfTheDay = [
  'Validate before you build: talk to 10 potential customers this week.',
  'In Zambia, mobile money is your friend — accept Airtel & MTN from day one.',
  'A simple Google Form can be your MVP. Don\'t over-engineer.',
  'Pricing tip: charge what your best customer can pay, not your average customer.',
  'Build in public — share weekly progress on socials to attract supporters.',
];

const EntrepreneurDashboardPage: React.FC = () => {
  const { ventures, milestones, loading } = useVentures();

  const stats = useMemo(() => {
    const totalFunding = ventures.reduce((s, v) => s + (v.funding_amount || 0), 0);
    const avgProgress = ventures.length
      ? Math.round(ventures.reduce((s, v) => s + (v.progress || 0), 0) / ventures.length)
      : 0;
    const completedMilestones = milestones.filter(m => m.completed).length;
    return {
      totalFunding,
      avgProgress,
      ventureCount: ventures.length,
      completedMilestones,
      totalMilestones: milestones.length,
    };
  }, [ventures, milestones]);

  const tip = tipsOfTheDay[new Date().getDate() % tipsOfTheDay.length];

  return (
    <div className="space-y-6">
      {/* Hero / welcome */}
      <Card className="border-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Entrepreneur Environment</p>
            <h1 className="text-2xl sm:text-3xl font-bold">Build, fund, and scale your Zambian venture</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Everything you need — plan, pitch, learn, find funding, talk to mentors — in one place.
            </p>
          </div>
          <Link to="/entrepreneur?tab=ventures">
            <Button size="lg" className="gap-2">
              <Rocket className="w-4 h-4" /> New venture
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={Rocket} label="Active ventures" value={stats.ventureCount} accent="from-blue-500 to-indigo-500" />
        <StatTile icon={Target} label="Avg progress" value={`${stats.avgProgress}%`} accent="from-emerald-500 to-teal-500" />
        <StatTile icon={CheckCircle2} label="Milestones done" value={`${stats.completedMilestones}/${stats.totalMilestones}`} accent="from-violet-500 to-purple-500" />
        <StatTile icon={DollarSign} label="Tracked funding" value={`ZMW ${stats.totalFunding.toLocaleString()}`} accent="from-amber-500 to-orange-500" />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" /> Quick actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map(a => (
              <Link key={a.label} to={a.to} className="group">
                <div className="rounded-xl border border-border/40 p-3 hover:border-primary/40 hover:shadow-md transition-all bg-card">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center mb-2`}>
                    <a.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-medium text-sm">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary">
                    Open <ArrowRight className="w-3 h-3" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My ventures */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> My ventures
          </CardTitle>
          <Link to="/entrepreneur?tab=ventures">
            <Button size="sm" variant="ghost">View all <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : ventures.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <Rocket className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No ventures yet — start your first one.</p>
              <Link to="/entrepreneur?tab=ventures">
                <Button size="sm"><Rocket className="w-3.5 h-3.5 mr-1.5" /> Create venture</Button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {ventures.slice(0, 4).map(v => (
                <div key={v.id} className="border border-border/40 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.sector || 'General'}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{v.stage}</Badge>
                  </div>
                  <Progress value={v.progress} className="h-1.5 mb-1" />
                  <p className="text-[11px] text-muted-foreground">{v.progress}% · ZMW {v.funding_amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Continue learning (entrepreneur courses) */}
      <ContinueLearning track="entrepreneur" title="Continue your entrepreneur courses" />

      {/* Tip + recommended learning */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-amber-50/60 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold">Tip of the day</h3>
            </div>
            <p className="text-sm text-foreground/90">{tip}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Recommended for founders</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              World-class free courses curated for builders — YC Startup School, Harvard on emerging economies, and more.
            </p>
            <Link to="/free-courses?track=entrepreneur">
              <Button size="sm" variant="outline">Browse entrepreneur courses <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatTile: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; accent: string }> = ({ icon: Icon, label, value, accent }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold truncate">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default EntrepreneurDashboardPage;
