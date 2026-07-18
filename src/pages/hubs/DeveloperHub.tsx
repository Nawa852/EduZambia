import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import {
  Wrench, Code, Terminal, GitBranch, Bug, Rocket,
  GraduationCap, Brain, Shield, Trophy, FolderGit2, Sparkles,
} from 'lucide-react';

type Tool = { title: string; desc: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: string };
type Group = { label: string; accent: string; tools: Tool[] };

const groups: Group[] = [
  {
    label: 'Build',
    accent: 'from-slate-600/15 to-zinc-700/10',
    tools: [
      { title: 'AI Developer Suite', desc: '15+ AI dev tools', href: '/ai-developer-suite', icon: Sparkles, badge: 'AI' },
      { title: 'BrightSphere IDE', desc: 'Web code workspace', href: '/developer-ide', icon: Terminal, badge: 'IDE' },
      { title: 'Projects', desc: 'Your repos & builds', href: '/developer-projects', icon: FolderGit2 },
      { title: 'Code Review', desc: 'AI pull-request review', href: '/developer-code-review', icon: GitBranch, badge: 'AI' },
    ],
  },
  {
    label: 'Practice',
    accent: 'from-indigo-500/15 to-blue-500/10',
    tools: [
      { title: 'Coding Challenges', desc: 'Daily algorithm drills', href: '/developer-challenges', icon: Bug },
      { title: 'AI Pair Programmer', desc: 'Ask for code help', href: '/ai?tab=tutor', icon: Brain, badge: 'AI' },
      { title: 'Cybersecurity Lab', desc: 'Hack the box-style', href: '/cybersecurity', icon: Shield },
    ],
  },
  {
    label: 'Learn',
    accent: 'from-emerald-500/15 to-teal-500/10',
    tools: [
      { title: 'Free Developer Courses', desc: 'CS50 · MIT · freeCodeCamp', href: '/free-courses?track=developer', icon: GraduationCap, badge: 'FREE' },
      { title: 'Build & Ship', desc: 'Project-based courses', href: '/learn?tab=catalog', icon: Code },
      { title: 'Entrepreneur Hub', desc: 'Turn code into a startup', href: '/entrepreneur', icon: Rocket },
      { title: 'Achievements', desc: 'Badges & XP', href: '/progress?tab=achievements', icon: Trophy },
    ],
  },
];

const DeveloperHub: React.FC = () => (
  <div className="space-y-6">
    <PageHeader
      icon={Wrench}
      title="Developer"
      subtitle="Code, ship and learn — a full workspace for Zambian developers and hackers."
    />
    {groups.map((g) => (
      <section key={g.label} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{g.label}</h2>
          <span className="text-[11px] text-muted-foreground">{g.tools.length} tools</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {g.tools.map((t) => (
            <Link key={t.href} to={t.href} className="group">
              <Card className={`relative overflow-hidden p-4 h-full border-border/30 hover:border-primary/40 hover:shadow-card-hover transition-all bg-gradient-to-br ${g.accent}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center text-primary shadow-sm">
                    <t.icon className="w-4 h-4" />
                  </div>
                  {t.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">{t.badge}</span>
                  )}
                </div>
                <div className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">{t.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{t.desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    ))}
  </div>
);

export default DeveloperHub;
