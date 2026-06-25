import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Code2, GitBranch, Bug, Rocket, Terminal, Play, Sparkles,
  Cpu, Database, FileCode, Trophy, Plus, ArrowRight, Github,
  Calendar, CheckCircle2,
} from 'lucide-react';

interface Props { userName: string; }

export function DeveloperDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  const stats = [
    { icon: Code2, label: 'Active Projects', value: '4', sub: '2 deployed', tint: 'bg-blue-500/10 text-blue-600' },
    { icon: GitBranch, label: 'Commits', value: '128', sub: 'This month', tint: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Bug, label: 'Issues Resolved', value: '32', sub: '+12 this week', tint: 'bg-rose-500/10 text-rose-600' },
    { icon: Trophy, label: 'Skill Level', value: 'L7', sub: 'Mid-level engineer', tint: 'bg-amber-500/10 text-amber-600' },
  ];

  const projects = [
    { name: 'AgriTrack API', stack: 'Node · Postgres · Redis', progress: 75, status: 'Active', tint: 'bg-emerald-500/10 text-emerald-700' },
    { name: 'StudyHub Mobile', stack: 'React Native · Expo', progress: 42, status: 'In Progress', tint: 'bg-blue-500/10 text-blue-700' },
    { name: 'Markdown Editor', stack: 'TS · Vite · Tailwind', progress: 95, status: 'Review', tint: 'bg-amber-500/10 text-amber-700' },
  ];

  const tools = [
    { icon: Terminal, label: 'IDE Workspace', tint: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300', to: '/developer/ide' },
    { icon: Sparkles, label: 'AI Code Review', tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10', to: '/developer/review' },
    { icon: Github, label: 'Repos', tint: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300', to: '/developer/repos' },
    { icon: Database, label: 'Database Lab', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', to: '/developer/db' },
    { icon: Cpu, label: 'Algorithms', tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10', to: '/developer/algorithms' },
    { icon: FileCode, label: 'Snippets', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10', to: '/developer/snippets' },
  ];

  const challenges = [
    { title: 'Binary Search Tree Traversal', tag: 'Algorithms · Medium', xp: 120, done: false },
    { title: 'REST API with JWT', tag: 'Backend · Easy', xp: 80, done: true },
    { title: 'Optimize React Re-renders', tag: 'Frontend · Hard', xp: 200, done: false },
  ];

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge className="mb-2 uppercase tracking-wider text-[10px] bg-blue-500/10 text-blue-700 border-0">Developer</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{greeting()}, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Ready to ship something today?</p>
        </div>
        <Button onClick={() => navigate('/developer/ide')} className="rounded-full">
          <Play className="w-3.5 h-3.5 mr-1.5" /> Open IDE
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
            <div className="text-[11px] text-muted-foreground">{s.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl border-border/40 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">My Projects</h2>
            <button onClick={() => navigate('/developer/projects')} className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.name} onClick={() => navigate('/developer/ide')} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/30 hover:bg-muted/50 cursor-pointer transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <Badge className={`${p.tint} border-0 text-[10px]`}>{p.status}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">{p.stack}</div>
                  <Progress value={p.progress} className="h-1 mt-1.5" />
                </div>
                <div className="text-xs font-semibold text-muted-foreground shrink-0">{p.progress}%</div>
              </div>
            ))}
            <Button onClick={() => navigate('/developer/projects/new')} variant="outline" className="w-full rounded-full text-xs h-9">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Project
            </Button>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Daily Challenges</h2>
            <button className="text-xs text-primary font-medium">View all</button>
          </div>
          <div className="space-y-2.5">
            {challenges.map((c) => (
              <div key={c.title} className="flex items-start gap-2.5">
                <div className={`w-5 h-5 rounded ${c.done ? 'bg-emerald-500 border-emerald-500' : 'border-2 border-muted-foreground/30'} flex items-center justify-center shrink-0 mt-0.5`}>
                  {c.done && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${c.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>{c.title}</div>
                  <div className="text-[11px] text-muted-foreground">{c.tag}</div>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">+{c.xp} XP</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4 rounded-2xl border-border/40">
        <h2 className="font-bold mb-3">Dev Tools</h2>
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

      <Card className="p-5 rounded-2xl border-border/40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-lg font-extrabold flex items-center gap-2"><Rocket className="w-5 h-5" /> Ship your next feature</div>
            <div className="text-sm opacity-90 mt-1">Open the AI-powered IDE workspace and let's build.</div>
          </div>
          <Button onClick={() => navigate('/developer/ide')} variant="secondary" className="rounded-full font-semibold">Launch IDE</Button>
        </div>
        <div className="absolute -bottom-4 -right-4 text-7xl opacity-20 select-none">⚡</div>
      </Card>
    </div>
  );
}
