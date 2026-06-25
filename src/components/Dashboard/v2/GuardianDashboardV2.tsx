import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Users, BookOpen, TrendingUp, Bell, Calendar, Heart,
  MessageCircle, AlertCircle, CheckCircle2, Trophy,
  GraduationCap, Clock, ArrowRight, Plus, Sparkles, Shield,
} from 'lucide-react';

interface Props { userName: string; }

export function GuardianDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  const children = [
    { name: 'Chanda Mwale', grade: 'Grade 10A', avg: 84, attendance: 96, streak: 12, tint: 'from-blue-500/20 to-purple-500/20' },
    { name: 'Mulenga Mwale', grade: 'Grade 7B', avg: 78, attendance: 92, streak: 8, tint: 'from-emerald-500/20 to-cyan-500/20' },
  ];

  const stats = [
    { icon: Users, label: 'Children', value: '2', sub: 'Linked accounts', tint: 'bg-blue-500/10 text-blue-600' },
    { icon: TrendingUp, label: 'Avg Performance', value: '81%', sub: '+4% this term', tint: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Heart, label: 'Attendance', value: '94%', sub: 'This month', tint: 'bg-rose-500/10 text-rose-600' },
    { icon: Trophy, label: 'Badges Earned', value: '18', sub: '+3 this week', tint: 'bg-amber-500/10 text-amber-600' },
  ];

  const alerts = [
    { title: 'Mathematics Test on Friday', desc: 'Chanda has an upcoming algebra test', when: '2h ago', tone: 'bg-blue-500/10 text-blue-600', icon: Calendar },
    { title: 'Excellent Quiz Result!', desc: 'Mulenga scored 92% on Science quiz', when: '5h ago', tone: 'bg-emerald-500/10 text-emerald-600', icon: Trophy },
    { title: 'Parent-Teacher Meeting', desc: 'Scheduled for May 28 at 14:00', when: '1d ago', tone: 'bg-purple-500/10 text-purple-600', icon: Users },
  ];

  const tools = [
    { icon: MessageCircle, label: 'Message Teacher', tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10', to: '/messages' },
    { icon: Calendar, label: 'School Calendar', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', to: '/calendar' },
    { icon: TrendingUp, label: 'Progress Reports', tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10', to: '/reports' },
    { icon: Shield, label: 'Screen Time', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10', to: '/screen-time' },
    { icon: BookOpen, label: 'Homework Help', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10', to: '/homework' },
    { icon: Bell, label: 'Notifications', tint: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10', to: '/notifications' },
  ];

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge className="mb-2 uppercase tracking-wider text-[10px] bg-pink-500/10 text-pink-700 border-0">Guardian</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's how your children are doing today.</p>
        </div>
        <Button onClick={() => navigate('/link-child')} variant="outline" className="rounded-full text-xs h-9">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Link a child
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 rounded-2xl border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-xl ${s.tint} flex items-center justify-center`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            </div>
            <div className="text-2xl font-extrabold mt-1">{s.value}</div>
            <div className="text-[11px] text-emerald-600 font-medium">{s.sub}</div>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">My Children</h2>
          <button onClick={() => navigate('/guardian/children')} className="text-xs text-primary font-medium">View all</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {children.map((c) => (
            <Card key={c.name} onClick={() => navigate(`/guardian/child/${encodeURIComponent(c.name)}`)} className="p-4 rounded-2xl border-border/40 cursor-pointer hover:shadow-md transition-all relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${c.tint} opacity-50 pointer-events-none`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-card border-2 border-card shadow-sm flex items-center justify-center text-lg font-bold text-primary">
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.grade}</div>
                    </div>
                  </div>
                  <Badge className="bg-amber-500/15 text-amber-700 border-0 text-[10px]">🔥 {c.streak}d</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Avg Grade</div>
                    <div className="text-lg font-extrabold">{c.avg}%</div>
                    <Progress value={c.avg} className="h-1 mt-1" />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Attendance</div>
                    <div className="text-lg font-extrabold">{c.attendance}%</div>
                    <Progress value={c.attendance} className="h-1 mt-1" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="font-bold">Recent Alerts</h2>
            </div>
            <button className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.title} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${a.tone} flex items-center justify-center shrink-0`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">{a.when}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <h2 className="font-bold mb-3">Guardian Tools</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {tools.map((t) => (
              <button key={t.label} onClick={() => navigate(t.to)} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className={`w-11 h-11 rounded-2xl ${t.tint} flex items-center justify-center`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 rounded-2xl border-border/40 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-card shadow flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-bold">Weekly Family Report</div>
              <div className="text-xs text-muted-foreground">AI-generated insights from your children's learning journey</div>
            </div>
          </div>
          <Button onClick={() => navigate('/guardian/report')} className="rounded-full">View Report <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Button>
        </div>
      </Card>
    </div>
  );
}
