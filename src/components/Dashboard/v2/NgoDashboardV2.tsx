import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart, Database, Users, ShieldCheck, BookOpen, Briefcase, Code2, Leaf,
  FolderOpen, Wallet, FileText, Globe, Plus, Calendar, ArrowRight,
  Droplet, GraduationCap, MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';

interface Props { userName: string; }

const Sparkline = ({ color, points }: { color: string; points: string }) => (
  <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
    <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
  </svg>
);

export function NgoDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const { isDemo } = useAuth();
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = (userName || 'Partner').split(' ')[0];

  const stats = isDemo ? [
    { icon: Heart, label: 'Total Projects', value: '18', sub: 'Active projects', trend: '↑ 3 this month', tint: 'bg-emerald-500/10 text-emerald-600', stroke: '#10b981', line: '0,22 15,20 30,18 45,14 60,12 75,10 90,8 100,6' },
    { icon: Database, label: 'Funds Deployed', value: 'ZMW 356,780', sub: 'This month', trend: '↑ 12% vs last month', tint: 'bg-violet-500/10 text-violet-600', stroke: '#8b5cf6', line: '0,24 15,20 30,18 45,14 60,10 75,12 90,6 100,4' },
    { icon: Users, label: 'Beneficiaries Reached', value: '8,642', sub: 'This month', trend: '↑ 18% vs last month', tint: 'bg-amber-500/10 text-amber-600', stroke: '#f59e0b', line: '0,20 15,18 30,16 45,14 60,12 75,10 90,8 100,6' },
    { icon: ShieldCheck, label: 'Impact Score', value: '87%', sub: 'Avg. this month', trend: '↑ 9% vs last month', tint: 'bg-blue-500/10 text-blue-600', stroke: '#3b82f6', line: '0,20 15,16 30,18 45,12 60,14 75,8 90,10 100,4' },
  ] : [
    { icon: Heart, label: 'Total Projects', value: '0', sub: 'Start your first', trend: '', tint: 'bg-emerald-500/10 text-emerald-600', stroke: '#10b981', line: '0,25 100,25' },
    { icon: Database, label: 'Funds Deployed', value: 'ZMW 0', sub: 'No disbursements yet', trend: '', tint: 'bg-violet-500/10 text-violet-600', stroke: '#8b5cf6', line: '0,25 100,25' },
    { icon: Users, label: 'Beneficiaries Reached', value: '0', sub: 'Log your first', trend: '', tint: 'bg-amber-500/10 text-amber-600', stroke: '#f59e0b', line: '0,25 100,25' },
    { icon: ShieldCheck, label: 'Impact Score', value: '—', sub: 'Report to unlock', trend: '', tint: 'bg-blue-500/10 text-blue-600', stroke: '#3b82f6', line: '0,25 100,25' },
  ];

  const impact = isDemo ? [
    { icon: BookOpen, label: 'Students Educated', value: '4,215', tint: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Briefcase, label: 'People Received Healthcare', value: '2,843', tint: 'bg-blue-500/10 text-blue-600' },
    { icon: Code2, label: 'Youth Trained in Digital Skills', value: '1,584', tint: 'bg-amber-500/10 text-amber-600' },
    { icon: Leaf, label: 'Communities Supported', value: '672', tint: 'bg-violet-500/10 text-violet-600' },
  ] : [
    { icon: BookOpen, label: 'Students Educated', value: '0', tint: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Briefcase, label: 'People Received Healthcare', value: '0', tint: 'bg-blue-500/10 text-blue-600' },
    { icon: Code2, label: 'Youth Trained in Digital Skills', value: '0', tint: 'bg-amber-500/10 text-amber-600' },
    { icon: Leaf, label: 'Communities Supported', value: '0', tint: 'bg-violet-500/10 text-violet-600' },
  ];

  const projects = isDemo ? [
    { icon: Leaf, name: 'Rural Coding Bootcamps', desc: 'Digital education for rural youth', pct: 72, tint: 'bg-emerald-500/10 text-emerald-600', bar: 'bg-emerald-500' },
    { icon: Heart, name: 'Community Health Initiative', desc: 'Maternal & child healthcare', pct: 65, tint: 'bg-blue-500/10 text-blue-600', bar: 'bg-blue-500' },
    { icon: BookOpen, name: 'Girls in STEM Program', desc: 'Encouraging girls in technology', pct: 80, tint: 'bg-amber-500/10 text-amber-600', bar: 'bg-amber-500' },
    { icon: Droplet, name: 'Clean Water Access Project', desc: 'Providing clean water to communities', pct: 60, tint: 'bg-violet-500/10 text-violet-600', bar: 'bg-violet-500' },
  ] : [];

  const donors = isDemo ? [
    { name: 'Global Impact Fund', amount: 'ZMW 120,000' },
    { name: 'African Education Trust', amount: 'ZMW 85,000' },
    { name: 'Health For All Foundation', amount: 'ZMW 60,000' },
  ] : [];

  const activities = isDemo ? [
    { icon: Database, title: 'New fund received', desc: 'From Global Impact Fund', when: '2h ago', amount: '+ZMW 50,000', tint: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Users, title: '120 beneficiaries added', desc: 'Rural Coding Bootcamps', when: '4h ago', amount: '', tint: 'bg-blue-500/10 text-blue-600' },
    { icon: FileText, title: 'Project report submitted', desc: 'Community Health Initiative', when: '1d ago', amount: '', tint: 'bg-amber-500/10 text-amber-600' },
    { icon: ShieldCheck, title: 'Milestone achieved', desc: 'Girls in STEM Program', when: '2d ago', amount: '', tint: 'bg-violet-500/10 text-violet-600' },
  ] : [];

  const funding = [
    { label: 'Education', pct: 40, color: '#10b981' },
    { label: 'Health', pct: 30, color: '#3b82f6' },
    { label: 'Livelihoods', pct: 20, color: '#f59e0b' },
    { label: 'WASH', pct: 10, color: '#8b5cf6' },
  ];

  let cumulative = 0;
  const segments = funding.map((f) => {
    const start = cumulative;
    cumulative += f.pct;
    return { ...f, start, end: cumulative };
  });

  const quickAccess = [
    { icon: Heart, label: 'Projects', tint: 'bg-emerald-500/10 text-emerald-600', to: '/ngo?tab=projects' },
    { icon: Users, label: 'Beneficiaries', tint: 'bg-violet-500/10 text-violet-600', to: '/ngo?tab=beneficiaries' },
    { icon: Wallet, label: 'Funds', tint: 'bg-blue-500/10 text-blue-600', to: '/ngo?tab=funds' },
    { icon: FileText, label: 'Reports', tint: 'bg-amber-500/10 text-amber-600', to: '/ngo?tab=reports' },
    { icon: Globe, label: 'Localization', tint: 'bg-emerald-500/10 text-emerald-600', to: '/ngo?tab=localization' },
    { icon: MoreHorizontal, label: 'More', tint: 'bg-muted text-foreground/60', to: '/ngo' },
  ];

  return (
    <div className="space-y-5 pb-24 lg:pb-8 max-w-[1280px] mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge className="mb-2 uppercase tracking-wider text-[10px] bg-emerald-500/10 text-emerald-700 border-0">NGO / Humanitarian</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Together, we create measurable impact.</p>
        </div>
        <Card className="px-3 py-2 rounded-2xl border-border/40 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">This Month</span>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 rounded-2xl border-border/40">
            <div className={`w-8 h-8 rounded-xl ${s.tint} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            <div className="text-xl lg:text-2xl font-extrabold mt-1">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.sub}</div>
            {s.trend && <div className="text-[11px] text-emerald-600 font-medium mt-1">{s.trend}</div>}
            <div className="mt-2"><Sparkline color={s.stroke} points={s.line} /></div>
          </Card>
        ))}
      </div>

      <Card className="p-4 lg:p-5 rounded-2xl border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Impact Overview</h2>
          <button className="text-xs text-primary font-medium flex items-center gap-1">View full report <ArrowRight className="w-3 h-3" /></button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {impact.map((i) => (
            <div key={i.label} className="text-center">
              <div className={`w-12 h-12 rounded-full ${i.tint} flex items-center justify-center mx-auto mb-2`}>
                <i.icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-extrabold">{i.value}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">{i.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Active Projects</h2>
            <button onClick={() => navigate('/ngo?tab=projects')} className="text-xs text-primary font-medium">View all</button>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Create your first project to track impact.</p>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <button key={p.name} onClick={() => navigate('/ngo?tab=projects')} className="w-full flex items-center gap-3 group">
                  <div className={`w-10 h-10 rounded-xl ${p.tint} flex items-center justify-center shrink-0`}>
                    <p.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.desc}</div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${p.bar} rounded-full`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                  <div className="text-xs font-bold shrink-0">{p.pct}%</div>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/ngo?tab=projects')} className="w-full mt-3 py-2 rounded-xl border border-dashed border-border text-xs font-semibold text-primary flex items-center justify-center gap-1 hover:bg-primary/5">
            <Plus className="w-4 h-4" /> Add New Project
          </button>
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Funding Utilization</h2>
            <button className="text-xs text-primary font-medium">View details</button>
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                {segments.map((seg, i) => {
                  const r = 40;
                  const c = 2 * Math.PI * r;
                  const dash = ((seg.end - seg.start) / 100) * c;
                  const offset = -(seg.start / 100) * c;
                  return (
                    <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="16"
                      strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={offset} />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[10px] text-muted-foreground">ZMW</div>
                <div className="text-lg font-extrabold">{isDemo ? '356,780' : '0'}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-[140px]">
              {funding.map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} />
                  <span className="flex-1">{f.label}</span>
                  <span className="font-semibold">{f.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Top Donors</h2>
            <button className="text-xs text-primary font-medium">View all</button>
          </div>
          {donors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Donor contributions will appear here.</p>
          ) : (
            <div className="space-y-3">
              {donors.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border-2 border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                    {d.name.split(' ').map(x => x[0]).slice(0, 3).join('')}
                  </div>
                  <div className="flex-1 text-sm font-medium truncate">{d.name}</div>
                  <div className="text-sm font-bold text-emerald-600">{d.amount}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Recent Activities</h2>
            <button className="text-xs text-primary font-medium">View all</button>
          </div>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Activity will appear as projects progress.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${a.tint} flex items-center justify-center shrink-0`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{a.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    {a.amount && <div className="text-xs font-bold text-emerald-600">{a.amount}</div>}
                    <div className="text-[10px] text-muted-foreground">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4 rounded-2xl border-border/40">
        <h2 className="font-bold mb-3">Quick Access</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
          {quickAccess.map((a) => (
            <button key={a.label} onClick={() => navigate(a.to)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 hover:bg-muted transition-colors">
              <div className={`w-11 h-11 rounded-2xl ${a.tint} flex items-center justify-center`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
