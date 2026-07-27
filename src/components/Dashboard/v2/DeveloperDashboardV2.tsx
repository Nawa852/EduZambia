import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import {
  Code2, GitBranch, Bug, Rocket, Terminal, Play, Sparkles,
  Cpu, Database, FileCode, Trophy, Plus, Github,
} from 'lucide-react';

interface Props { userName: string; }

interface DevProject {
  id: string; name: string; language: string | null; description: string | null;
  progress: number | null; status: string | null;
}
interface Bounty { id: string; title: string; reward_kwacha: number | null; status: string | null; }

const tools = [
  { icon: Terminal, label: 'IDE', tint: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300', to: '/developer/ide' },
  { icon: Sparkles, label: 'AI Review', tint: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10', to: '/developer/review' },
  { icon: Github, label: 'Repos', tint: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300', to: '/developer/repos' },
  { icon: Database, label: 'DB Lab', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', to: '/developer/db' },
  { icon: Cpu, label: 'Algorithms', tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10', to: '/developer/algorithms' },
  { icon: FileCode, label: 'Snippets', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10', to: '/developer/snippets' },
];

export function DeveloperDashboardV2({ userName }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<DevProject[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [submissions, setSubmissions] = useState(0);
  const [loading, setLoading] = useState(true);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setLoading(false); return; }
      const [proj, bty, subs] = await Promise.all([
        supabase.from('developer_projects')
          .select('id, name, language, description, progress, status')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('developer_bounties')
          .select('id, title, reward_kwacha, status')
          .eq('status', 'open').order('created_at', { ascending: false }).limit(5),
        supabase.from('developer_bounty_submissions')
          .select('id', { count: 'exact', head: true }).eq('developer_id', user.id),
      ]);
      if (cancelled) return;
      setProjects((proj.data ?? []) as DevProject[]);
      setBounties((bty.data ?? []) as Bounty[]);
      setSubmissions(subs.count ?? 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const deployed = projects.filter(p => (p.status || '').toLowerCase() === 'deployed').length;
  const avgProgress = projects.length
    ? Math.round(projects.reduce((a, p) => a + (p.progress ?? 0), 0) / projects.length)
    : 0;

  const stats = [
    { icon: Code2, label: 'Projects', value: projects.length, sub: `${deployed} deployed`, tint: 'bg-blue-500/10 text-blue-600' },
    { icon: GitBranch, label: 'Avg. progress', value: `${avgProgress}%`, sub: 'Across projects', tint: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Bug, label: 'Submissions', value: submissions, sub: 'Bounty entries', tint: 'bg-rose-500/10 text-rose-600' },
    { icon: Trophy, label: 'Open bounties', value: bounties.length, sub: 'Available now', tint: 'bg-amber-500/10 text-amber-600' },
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
        {loading
          ? [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[104px] rounded-2xl" />)
          : stats.map(s => (
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
            <h2 className="font-bold">My projects</h2>
            <button onClick={() => navigate('/developer/projects')} className="text-xs text-primary font-medium">View all</button>
          </div>
          {loading ? (
            <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : projects.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Code2 className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No projects yet — create one to start tracking progress.</p>
              <Button size="sm" className="rounded-full" onClick={() => navigate('/developer/projects')}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />New project
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(p => (
                <div key={p.id} onClick={() => navigate('/developer/ide')} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/30 hover:bg-muted/50 cursor-pointer transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      {p.status && <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate">{p.language || p.description || '—'}</div>
                    <Progress value={p.progress ?? 0} className="h-1 mt-1.5" />
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground shrink-0">{p.progress ?? 0}%</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 rounded-2xl border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Open bounties</h2>
            <button onClick={() => navigate('/developer/bounties')} className="text-xs text-primary font-medium">View all</button>
          </div>
          {loading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : bounties.length === 0 ? (
            <div className="py-8 text-center space-y-1.5">
              <Trophy className="w-7 h-7 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No open bounties right now.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {bounties.map(b => (
                <button key={b.id} onClick={() => navigate('/developer/bounties')} className="w-full flex items-start gap-2.5 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.title}</div>
                  </div>
                  {b.reward_kwacha != null && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">K{b.reward_kwacha}</Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4 rounded-2xl border-border/40">
        <h2 className="font-bold mb-3">Dev tools</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
          {tools.map(t => (
            <button key={t.label} onClick={() => navigate(t.to)} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
              <div className={`w-12 h-12 rounded-2xl ${t.tint} flex items-center justify-center`}>
                <t.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 rounded-2xl border-border/40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-primary-foreground relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-lg font-extrabold flex items-center gap-2"><Rocket className="w-5 h-5" /> Ship your next feature</div>
            <div className="text-sm opacity-90 mt-1">Open the AI-powered IDE workspace and let's build.</div>
          </div>
          <Button onClick={() => navigate('/developer/ide')} variant="secondary" className="rounded-full font-semibold">Launch IDE</Button>
        </div>
      </Card>
    </div>
  );
}
