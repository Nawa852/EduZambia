import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope, Activity, ClipboardList, BookOpen, Calendar, Plus,
  HeartPulse, Pill, Brain, Microscope, TestTube, FileText,
  Users, AlertCircle, ArrowRight, Sparkles,
} from 'lucide-react';

interface Props { userName: string; }

export function MedicalDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  const stats = [
    { icon: Stethoscope, label: 'Active Cases', value: '12', sub: 'Simulations in progress', tint: 'bg-rose-500/10 text-rose-600' },
    { icon: BookOpen, label: 'Modules', value: '8', sub: 'Completed this month', tint: 'bg-blue-500/10 text-blue-600' },
    { icon: TestTube, label: 'Lab Reviews', value: '24', sub: 'This week', tint: 'bg-purple-500/10 text-purple-600' },
    { icon: Activity, label: 'CPD Hours', value: '46h', sub: 'Continuing education', tint: 'bg-emerald-500/10 text-emerald-600' },
  ];

  const cases = [
    { title: 'Acute Chest Pain', patient: '52yo M, hypertensive', difficulty: 'Hard', progress: 60, tint: 'bg-rose-500/10 text-rose-700' },
    { title: 'Pediatric Fever', patient: '4yo F, 3-day history', difficulty: 'Medium', progress: 80, tint: 'bg-amber-500/10 text-amber-700' },
    { title: 'Malaria Differential', patient: '28yo M, returning traveler', difficulty: 'Medium', progress: 35, tint: 'bg-amber-500/10 text-amber-700' },
  ];

  const tools = [
    { icon: HeartPulse, label: 'Case Simulator', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10', to: '/medical/cases' },
    { icon: Pill, label: 'Drug Reference', tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10', to: '/medical/drugs' },
    { icon: Brain, label: 'Diagnosis Trainer', tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10', to: '/medical/diagnosis' },
    { icon: Microscope, label: 'Lab Results', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', to: '/medical/labs' },
    { icon: FileText, label: 'Clinical Notes', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10', to: '/medical/notes' },
    { icon: Users, label: 'Peer Consults', tint: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10', to: '/medical/consults' },
  ];

  const schedule = [
    { time: '09:00', title: 'Cardiology Case Review', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
    { time: '11:30', title: 'Pharmacology Quiz', tone: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
    { time: '14:00', title: 'Pediatrics Simulation', tone: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300' },
    { time: '16:00', title: 'Peer Discussion Group', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  ];

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge className="mb-2 uppercase tracking-wider text-[10px] bg-rose-500/10 text-rose-700 border-0">Medical Professional</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, Dr. {firstName}! 🩺</h1>
          <p className="text-sm text-muted-foreground mt-1">Sharpen your clinical reasoning with today's cases.</p>
        </div>
        <Card className="px-3 py-2 rounded-2xl border-border/40 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </Card>
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
            <div className="text-[11px] text-muted-foreground">{s.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl border-border/40 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h2 className="font-bold">Active Case Simulations</h2>
            </div>
            <button onClick={() => navigate('/medical/cases')} className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {cases.map((c) => (
              <div key={c.title} onClick={() => navigate('/medical/cases')} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/30 hover:bg-muted/50 cursor-pointer transition-all">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold truncate">{c.title}</div>
                    <Badge className={`${c.tint} border-0 text-[10px]`}>{c.difficulty}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{c.patient}</div>
                  <Progress value={c.progress} className="h-1 mt-1.5" />
                </div>
                <div className="text-xs font-semibold text-muted-foreground shrink-0">{c.progress}%</div>
              </div>
            ))}
            <Button onClick={() => navigate('/medical/cases/new')} variant="outline" className="w-full rounded-full text-xs h-9">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Start New Case
            </Button>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="font-bold">Today's Plan</h2>
            </div>
          </div>
          <div className="space-y-2.5">
            {schedule.map((s) => (
              <div key={s.time} className="flex items-center gap-3">
                <div className="text-[11px] font-semibold text-muted-foreground w-10 shrink-0">{s.time}</div>
                <div className={`flex-1 px-2.5 py-1.5 rounded-lg ${s.tone} text-xs font-medium truncate`}>{s.title}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4 rounded-2xl border-border/40">
        <h2 className="font-bold mb-3">Clinical Tools</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
          {tools.map((t) => (
            <button key={t.label} onClick={() => navigate(t.to)} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
              <div className={`w-12 h-12 rounded-2xl ${t.tint} flex items-center justify-center`}>
                <t.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 rounded-2xl border-border/40 bg-gradient-to-r from-rose-500/10 via-card to-purple-500/10 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-card shadow flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="font-bold">AI Diagnostic Coach</div>
              <div className="text-xs text-muted-foreground">Get instant Socratic feedback on your differential diagnoses.</div>
            </div>
          </div>
          <Button onClick={() => navigate('/medical/coach')} className="rounded-full">Open Coach <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Button>
        </div>
      </Card>
    </div>
  );
}
