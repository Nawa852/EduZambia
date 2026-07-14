import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Stethoscope, ClipboardList, GraduationCap, Users, MessageSquarePlus,
  Package, Pill, ShieldCheck, ArrowUpRight, Calendar, ArrowRight,
  AlertTriangle, Boxes, UserRound, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';

interface Props { userName: string; }

const Sparkline = ({ color, points }: { color: string; points: string }) => (
  <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
    <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
  </svg>
);

export function MedicalDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const { isDemo } = useAuth();
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  const stats = isDemo ? [
    { icon: BookOpen, label: 'CPD Progress', value: '72%', sub: '22 / 30 Credits', tint: 'bg-emerald-500/10 text-emerald-600', progress: 72, stroke: '#10b981', line: '0,24 15,20 30,22 45,16 60,18 75,10 90,12 100,8' },
    { icon: Stethoscope, label: 'Patients Consulted', value: '48', sub: '+6 vs last week', tint: 'bg-violet-500/10 text-violet-600', stroke: '#8b5cf6', line: '0,20 15,14 30,18 45,10 60,14 75,8 90,10 100,6' },
    { icon: ClipboardList, label: 'Clinical Cases', value: '15', sub: 'Reviewed', tint: 'bg-amber-500/10 text-amber-600', stroke: '#f59e0b', line: '0,20 15,18 30,14 45,16 60,10 75,12 90,8 100,10' },
    { icon: GraduationCap, label: 'Learning Streak', value: '12', sub: 'Days in a row', tint: 'bg-blue-500/10 text-blue-600', stroke: '#3b82f6', line: '0,24 15,20 30,18 45,14 60,12 75,10 90,8 100,6' },
  ] : [
    { icon: BookOpen, label: 'CPD Progress', value: '0%', sub: '0 / 30 Credits', tint: 'bg-emerald-500/10 text-emerald-600', progress: 0, stroke: '#10b981', line: '0,25 100,25' },
    { icon: Stethoscope, label: 'Patients Consulted', value: '0', sub: 'Start logging', tint: 'bg-violet-500/10 text-violet-600', stroke: '#8b5cf6', line: '0,25 100,25' },
    { icon: ClipboardList, label: 'Clinical Cases', value: '0', sub: 'Reviewed', tint: 'bg-amber-500/10 text-amber-600', stroke: '#f59e0b', line: '0,25 100,25' },
    { icon: GraduationCap, label: 'Learning Streak', value: '0', sub: 'Days in a row', tint: 'bg-blue-500/10 text-blue-600', stroke: '#3b82f6', line: '0,25 100,25' },
  ];

  const quickAccess = [
    { icon: Users, label: 'Patients', tint: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300', to: '/medical/patients' },
    { icon: MessageSquarePlus, label: 'Consult Cases', tint: 'bg-blue-500/10 text-blue-600', to: '/medical/consults' },
    { icon: Boxes, label: 'Clinical Sandbox', tint: 'bg-violet-500/10 text-violet-600', to: '/medical/sandbox' },
    { icon: GraduationCap, label: 'CPD Learning', tint: 'bg-emerald-500/10 text-emerald-600', to: '/medical/cpd' },
    { icon: BookOpen, label: 'Medical Library', tint: 'bg-amber-500/10 text-amber-600', to: '/medical/library' },
    { icon: Pill, label: 'Drug Guide', tint: 'bg-blue-500/10 text-blue-600', to: '/medical/drugs' },
    { icon: ShieldCheck, label: 'Protocols', tint: 'bg-emerald-500/10 text-emerald-600', to: '/medical/protocols' },
    { icon: ArrowUpRight, label: 'Referrals', tint: 'bg-rose-500/10 text-rose-600', to: '/medical/referrals' },
  ];

  const patients = isDemo ? [
    { initials: 'MT', name: 'Mary Tembo', desc: '24F • Follow-up', when: 'Today', badge: 'Outpatient', tint: 'bg-violet-500/10 text-violet-700' },
    { initials: 'JK', name: 'John Kalaba', desc: '45M • Hypertension', when: 'Today', badge: 'Outpatient', tint: 'bg-blue-500/10 text-blue-700' },
    { initials: 'LN', name: 'Loveness N.', desc: '32F • Antenatal Visit', when: 'Yesterday', badge: 'Outpatient', tint: 'bg-rose-500/10 text-rose-700' },
  ] : [];

  const alerts = isDemo ? [
    { icon: AlertTriangle, title: 'Drug Interaction Alert', desc: '2 potential interactions detected today', tint: 'bg-rose-500/10 text-rose-600' },
    { icon: Package, title: 'Stock Low', desc: '3 essential medicines running low', tint: 'bg-amber-500/10 text-amber-600' },
  ] : [];

  const recommended = isDemo ? [
    { title: 'Sepsis Management Guidelines 2024', tag: 'CPD • 2 Credits', tint: 'bg-blue-500' },
    { title: 'Diabetes Mellitus Updates', tag: 'CPD • 1.5 Credits', tint: 'bg-emerald-500' },
    { title: 'ECZ Clinical Protocols', tag: 'Protocol • Latest', tint: 'bg-violet-500' },
  ] : [];

  const cpdCompleted = isDemo ? 22 : 0;
  const cpdInProgress = isDemo ? 6 : 0;
  const cpdPending = isDemo ? 2 : 0;
  const cpdTotal = 30;
  const donutPct = ((cpdCompleted / cpdTotal) * 100) || 0;

  return (
    <div className="space-y-5 pb-24 lg:pb-8 max-w-[1280px] mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge className="mb-2 uppercase tracking-wider text-[10px] bg-emerald-500/10 text-emerald-700 border-0">Medical Professional</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, Dr. {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's your clinical and learning overview.</p>
        </div>
        <Card className="px-3 py-2 rounded-2xl border-border/40 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">This Week</span>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s: any) => (
          <Card key={s.label} className="p-4 rounded-2xl border-border/40">
            <div className={`w-8 h-8 rounded-xl ${s.tint} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-extrabold mt-1">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mb-2">{s.sub}</div>
            {typeof s.progress === 'number' ? (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.progress}%` }} />
              </div>
            ) : (
              <Sparkline color={s.stroke} points={s.line} />
            )}
          </Card>
        ))}
      </div>

      <Card className="p-4 rounded-2xl border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-card to-teal-500/5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-2xl">🫀</div>
          <div className="flex-1 min-w-[220px]">
            <div className="font-bold">3D Clinical Sandbox</div>
            <div className="text-xs text-muted-foreground">Practice anatomy, procedures and diagnostics in our interactive atlas.</div>
          </div>
          <Button onClick={() => navigate('/medical/sandbox')} variant="outline" className="rounded-full border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10">
            Open Sandbox <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </Card>

      <Card className="p-4 rounded-2xl border-border/40">
        <h2 className="font-bold mb-3">Quick Access</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {quickAccess.map((a) => (
            <button key={a.label} onClick={() => navigate(a.to)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted transition-colors border border-border/40">
              <div className={`w-10 h-10 rounded-xl ${a.tint} flex items-center justify-center`}>
                <a.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">CPD Progress</h2>
            <button onClick={() => navigate('/medical/cpd')} className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(donutPct / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-extrabold">{cpdCompleted}</div>
                <div className="text-[10px] text-muted-foreground">/{cpdTotal} Credits</div>
              </div>
            </div>
            <div className="space-y-2 flex-1 min-w-[140px]">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="flex-1">Completed</span>
                <span className="font-semibold">{cpdCompleted} ({Math.round(donutPct)}%)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="flex-1">In Progress</span>
                <span className="font-semibold">{cpdInProgress} ({Math.round((cpdInProgress / cpdTotal) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="flex-1">Pending</span>
                <span className="font-semibold">{cpdPending} ({Math.round((cpdPending / cpdTotal) * 100)}%)</span>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/medical/cpd')} className="w-full rounded-full mt-4 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10">Continue Learning</Button>
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Recent Patients</h2>
            <button onClick={() => navigate('/medical/patients')} className="text-xs text-primary font-medium">View all</button>
          </div>
          {patients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No patients logged yet.</p>
          ) : (
            <div className="space-y-3">
              {patients.map((p) => (
                <button key={p.name} onClick={() => navigate('/medical/patients')} className="w-full flex items-center gap-3 group">
                  <div className={`w-10 h-10 rounded-full ${p.tint} flex items-center justify-center font-bold text-xs shrink-0`}>{p.initials}</div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground">{p.when}</div>
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px] mt-0.5">{p.badge}</Badge>
                  </div>
                </button>
              ))}
              <button onClick={() => navigate('/medical/patients')} className="w-full text-xs text-primary font-medium mt-1 flex items-center justify-center gap-1">
                See all patients <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Clinical Cases Network</h2>
            <button onClick={() => navigate('/medical/cases')} className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-extrabold">{isDemo ? 7 : 0}</div>
              <div className="text-[11px] font-semibold mt-1">New Cases</div>
              <div className="text-[10px] text-muted-foreground">This Week</div>
            </div>
            <div className="border-x border-border/40">
              <div className="text-2xl font-extrabold">{isDemo ? 3 : 0}</div>
              <div className="text-[11px] font-semibold mt-1">Need Consultation</div>
              <div className="text-[10px] text-muted-foreground">From Specialists</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold">{isDemo ? 12 : 0}</div>
              <div className="text-[11px] font-semibold mt-1">Cases Resolved</div>
              <div className="text-[10px] text-muted-foreground">This Week</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Medication Alerts</h2>
            <button className="text-xs text-primary font-medium">View all</button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No active alerts.</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.title} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                  <div className={`w-10 h-10 rounded-xl ${a.tint} flex items-center justify-center shrink-0`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4 rounded-2xl border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-card">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <UserRound className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <div className="font-bold">Collaborate with Specialists</div>
            <div className="text-xs text-muted-foreground">Connect with specialists across Zambia for second opinions and case discussions.</div>
          </div>
          <Button onClick={() => navigate('/medical/consults')} variant="outline" className="rounded-full border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10">
            Find Specialist <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </Card>

      <Card className="p-4 rounded-2xl border-border/40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Recommended for You</h2>
          <button onClick={() => navigate('/medical/library')} className="text-xs text-primary font-medium">View all</button>
        </div>
        {recommended.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Recommendations will appear as you learn.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recommended.map((r) => (
              <button key={r.title} onClick={() => navigate('/medical/library')} className="flex items-start gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/30 hover:bg-muted/50 text-left transition-all">
                <div className={`w-12 h-12 rounded-xl ${r.tint} text-white flex items-center justify-center shrink-0 text-xl`}>📘</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold line-clamp-2">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{r.tag}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
