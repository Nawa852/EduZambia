import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/Auth/AuthProvider';
import {
  Briefcase, DollarSign, Trophy, Users, TrendingUp, Lightbulb, Target,
  UserPlus, Wallet, Rocket, FileText, BarChart3, Calendar, Plus,
  CheckCircle2, ArrowRight, MoreHorizontal, Sparkles, Leaf,
} from 'lucide-react';

interface Props { userName: string; }

export function EntrepreneurDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const { isDemo } = useAuth();
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  const stats = isDemo ? [
    { icon: Briefcase, label: 'Active Ventures', value: '3', sub: '2 in progress', tint: 'bg-purple-500/10 text-purple-600', link: '/entrepreneur?tab=ventures' },
    { icon: DollarSign, label: 'Total Funding', value: 'ZMW 128,500', sub: 'Received', tint: 'bg-emerald-500/10 text-emerald-600', link: '/entrepreneur?tab=funding' },
    { icon: Trophy, label: 'Bounties Won', value: '5', sub: 'ZMW 45,300', tint: 'bg-amber-500/10 text-amber-600', link: '/entrepreneur?tab=bounties' },
    { icon: Users, label: 'Network', value: '156', sub: '+12 this month', tint: 'bg-blue-500/10 text-blue-600', link: '/entrepreneur?tab=network' },
  ] : [
    { icon: Briefcase, label: 'Active Ventures', value: '0', sub: 'Create your first', tint: 'bg-purple-500/10 text-purple-600', link: '/entrepreneur/idea/new' },
    { icon: DollarSign, label: 'Total Funding', value: 'ZMW 0', sub: 'Apply for grants', tint: 'bg-emerald-500/10 text-emerald-600', link: '/entrepreneur?tab=funding' },
    { icon: Trophy, label: 'Bounties Won', value: '0', sub: 'Browse bounties', tint: 'bg-amber-500/10 text-amber-600', link: '/entrepreneur?tab=bounties' },
    { icon: Users, label: 'Network', value: '0', sub: 'Find co-founders', tint: 'bg-blue-500/10 text-blue-600', link: '/entrepreneur?tab=cofounders' },
  ];

  const quickActions = [
    { icon: Lightbulb, label: 'Create Idea', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10', to: '/entrepreneur/idea/new' },
    { icon: Target, label: 'Post a Bounty', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10', to: '/entrepreneur?tab=bounties' },
    { icon: UserPlus, label: 'Find Co-founder', tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10', to: '/entrepreneur?tab=cofounders' },
    { icon: Wallet, label: 'Apply for Funding', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', to: '/entrepreneur?tab=funding' },
    { icon: Rocket, label: 'Explore Incubator', tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10', to: '/entrepreneur?tab=incubator' },
    { icon: FileText, label: 'Legal Agreement', tint: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300', to: '/entrepreneur?tab=legal' },
    { icon: BarChart3, label: 'Business Plan', tint: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10', to: '/entrepreneur?tab=plans' },
    { icon: MoreHorizontal, label: 'More Tools', tint: 'bg-muted text-foreground/60', to: '/entrepreneur' },
  ];

  const opportunities = [
    { title: 'Zambia Innovation Fund', desc: 'Grant up to ZMW 100,000', kind: 'Grant', date: 'Deadline: May 31, 2025', tint: 'bg-emerald-500/10 text-emerald-700' },
    { title: 'SAVANNAH Fund', desc: 'Equity investment up to ZMW 500,000', kind: 'Equity', date: 'Deadline: Jun 15, 2025', tint: 'bg-blue-500/10 text-blue-700' },
    { title: 'AfriLabs Accelerator', desc: 'Acceleration program + funding', kind: 'Program', date: 'Deadline: Jun 30, 2025', tint: 'bg-purple-500/10 text-purple-700' },
  ];

  const ventures = isDemo ? [
    { name: 'AgriTrack Zambia', desc: 'Smart farm management platform for small scale farmers.', progress: 68, milestone: 'User testing phase', date: 'May 30, 2025', funding: 'ZMW 78,000 / 150,000', icon: '🌱', status: 'In Progress' },
  ] : [];

  const tasks = isDemo ? [
    { title: 'Complete user research', tag: 'AgriTrack Zambia', due: 'May 25', done: false },
    { title: 'Build MVP prototype', tag: 'AgriTrack Zambia', due: 'May 30', done: true },
    { title: 'Pitch deck presentation', tag: 'EduConnect', due: 'Jun 05', done: false },
    { title: 'Apply for innovation fund', tag: 'SolarPay', due: 'Jun 10', done: false },
  ] : [];

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge variant="secondary" className="mb-2 uppercase tracking-wider text-[10px] text-purple-700 bg-purple-500/10 border-0">Entrepreneur</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Let's build something amazing today.</p>
        </div>
        <Card className="px-3 py-2 rounded-2xl border-border/40 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">This Month</span>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} onClick={() => navigate(s.link)} className="p-4 rounded-2xl border-border/40 cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-xl ${s.tint} flex items-center justify-center`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            </div>
            <div className="text-xl font-extrabold mt-1">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.sub}</div>
            <svg className="mt-2 w-full h-6" viewBox="0 0 100 24" preserveAspectRatio="none">
              <polyline fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/60"
                points="0,18 15,14 30,16 45,10 60,12 75,6 90,8 100,4" />
            </svg>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Ventures */}
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">My Active Ventures</h2>
            <button onClick={() => navigate('/entrepreneur?tab=ventures')} className="text-xs text-primary font-medium">View all</button>
          </div>
          {ventures.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <Rocket className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">No ventures yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Start your first venture and track its progress.</p>
              <Button size="sm" onClick={() => navigate('/entrepreneur/idea/new')} className="rounded-full">Create your first venture</Button>
            </div>
          )}
          {ventures.map((v) => (
            <div key={v.name} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">{v.icon}</div>
                  <div>
                    <div className="font-semibold text-sm">{v.name}</div>
                    <div className="text-[11px] text-muted-foreground max-w-[220px]">{v.desc}</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">{v.status}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-card" />)}
                </div>
                <span className="text-[11px] text-muted-foreground">+2</span>
                <div className="flex-1 ml-2">
                  <Progress value={v.progress} className="h-1.5" />
                </div>
                <span className="text-xs font-semibold">{v.progress}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Next Milestone: <span className="text-foreground font-medium">{v.milestone}</span></span>
                <span>{v.date}</span>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">Funding Raised</div>
                <div className="text-sm font-semibold mb-1">{v.funding}</div>
                <Progress value={52} className="h-1.5" />
              </div>
              <Button variant="outline" onClick={() => navigate('/entrepreneur?tab=ventures')} className="w-full rounded-full text-xs h-9">View Venture</Button>
            </div>
          ))}
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 rounded-2xl border-border/40">
          <h2 className="font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((a) => (
              <button key={a.label} onClick={() => navigate(a.to)} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className={`w-11 h-11 rounded-2xl ${a.tint} flex items-center justify-center`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Funding Opportunities */}
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Top Funding Opportunities</h2>
            <button onClick={() => navigate('/entrepreneur?tab=funding')} className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {opportunities.map((o) => (
              <div key={o.title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{o.title}</div>
                  <div className="text-[11px] text-muted-foreground">{o.desc}</div>
                </div>
                <div className="text-right shrink-0">
                  <Badge className={`${o.tint} border-0 text-[10px] mb-1`}>{o.kind}</Badge>
                  <div className="text-[10px] text-muted-foreground">{o.date}</div>
                </div>
              </div>
            ))}
            <button onClick={() => navigate('/entrepreneur?tab=funding')} className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
              Browse all opportunities <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* Tasks & Milestones */}
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Tasks & Milestones</h2>
            <button onClick={() => navigate('/entrepreneur?tab=tasks')} className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="space-y-2.5">
            {tasks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No tasks yet. Create a venture to start tracking milestones.</p>
            )}
            {tasks.map((t) => (
              <div key={t.title} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded ${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-2 border-muted-foreground/30'} flex items-center justify-center shrink-0`}>
                  {t.done && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${t.done ? 'line-through text-muted-foreground' : 'font-medium'} truncate`}>{t.title}</div>
                  <div className="text-[11px] text-muted-foreground">{t.tag}</div>
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0">{t.due}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Launch your idea CTA */}
      <Card className="p-5 rounded-2xl border-border/40 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-lg font-extrabold flex items-center gap-2"><Rocket className="w-5 h-5" /> Launch your idea</div>
            <div className="text-sm opacity-90 mt-1">Turn your vision into impact with Nexus Learning.</div>
          </div>
          <Button onClick={() => navigate('/entrepreneur/idea/new')} variant="secondary" className="rounded-full font-semibold">Start Building</Button>
        </div>
        <div className="absolute -bottom-4 -right-4 text-7xl opacity-20 select-none">🚀</div>
      </Card>
    </div>
  );
}
