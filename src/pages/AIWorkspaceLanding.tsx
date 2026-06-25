import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain, MessageSquare, Mic, FileText, Upload, Calendar, Calculator,
  Zap, PenTool, Swords, Lightbulb, Layers, Target, Map, Sparkles,
} from 'lucide-react';

type Tool = {
  title: string; desc: string; href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string; accent: string;
};

type Group = { label: string; tools: Tool[] };

const groups: Group[] = [
  {
    label: 'Ask & Learn',
    tools: [
      { title: 'AI Chat',     desc: 'General-purpose chat tutor',    href: '/ai?tab=chat',   icon: MessageSquare, accent: 'from-blue-500/20 to-cyan-500/10' },
      { title: 'AI Tutor',    desc: 'Step-by-step subject coaching', href: '/ai?tab=tutor',  icon: Brain,         accent: 'from-violet-500/20 to-fuchsia-500/10', badge: 'PRO' },
      { title: 'Voice Tutor', desc: 'Talk back and forth',           href: '/ai?tab=voice',  icon: Mic,           accent: 'from-pink-500/20 to-rose-500/10', badge: 'NEW' },
      { title: 'AI Insights', desc: 'What to study next',            href: '/ai?tab=insights', icon: Lightbulb,   accent: 'from-amber-500/20 to-orange-500/10' },
    ],
  },
  {
    label: 'Solve & Practice',
    tools: [
      { title: 'Homework Solver', desc: 'Snap a photo, get steps', href: '/ai?tab=homework',     icon: Calculator, accent: 'from-emerald-500/20 to-teal-500/10', badge: 'NEW' },
      { title: 'Quiz Generator',  desc: 'Auto-generate practice',  href: '/ai?tab=quiz',         icon: Target,     accent: 'from-blue-500/20 to-indigo-500/10' },
      { title: 'Flashcards',      desc: 'Spaced repetition',       href: '/ai?tab=flashcards',   icon: Layers,     accent: 'from-violet-500/20 to-purple-500/10' },
      { title: 'Exam Predictor',  desc: 'Forecast likely topics',  href: '/ai?tab=exam-predict', icon: Zap,        accent: 'from-yellow-500/20 to-amber-500/10', badge: 'NEW' },
    ],
  },
  {
    label: 'Write & Create',
    tools: [
      { title: 'Essay Coach',   desc: 'Inline rubric scoring',  href: '/ai?tab=essay',        icon: PenTool, accent: 'from-rose-500/20 to-pink-500/10' },
      { title: 'Debate Arena',  desc: 'Argue with AI',          href: '/ai?tab=debate',       icon: Swords,  accent: 'from-red-500/20 to-orange-500/10' },
      { title: 'Mind Maps',     desc: 'Visualise concepts',     href: '/ai?tab=mind-maps',    icon: Map,     accent: 'from-cyan-500/20 to-sky-500/10' },
      { title: 'Exam Generator',desc: 'Build ECZ-style papers', href: '/ai?tab=exam-gen',     icon: FileText,accent: 'from-indigo-500/20 to-violet-500/10', badge: 'NEW' },
    ],
  },
  {
    label: 'Analyse & Plan',
    tools: [
      { title: 'Doc Analyzer',  desc: 'Upload PDFs, get answers', href: '/ai?tab=doc-analyzer', icon: Upload,   accent: 'from-teal-500/20 to-emerald-500/10', badge: 'NEW' },
      { title: 'Study Planner', desc: 'AI-built schedule',         href: '/ai?tab=smart-planner', icon: Calendar, accent: 'from-blue-500/20 to-violet-500/10', badge: 'NEW' },
      { title: 'Full Workspace',desc: 'Everything in one canvas',  href: '/ai?tab=workspace',  icon: Sparkles, accent: 'from-violet-500/20 to-pink-500/10' },
    ],
  },
];

export default function AIWorkspaceLanding() {
  return (
    <div className="space-y-6">
      {/* Quick hero stat */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/15 via-primary/10 to-blue-500/10 border border-border/40 p-5">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Brain className="w-6 h-6 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">BrightSphere AI</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              All your AI tools — Ask, Solve, Create, Analyse. Tuned for the Zambian ECZ curriculum.
            </p>
          </div>
        </div>
      </div>

      {groups.map(g => (
        <section key={g.label} className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{g.label}</h3>
            <span className="text-[11px] text-muted-foreground">{g.tools.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {g.tools.map(t => (
              <Link key={t.href} to={t.href} className="group">
                <Card className={`relative overflow-hidden p-4 h-full border-border/30 hover:border-primary/50 hover:shadow-card-hover transition-all bg-gradient-to-br ${t.accent}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center text-primary shadow-sm">
                      <t.icon className="w-4 h-4" />
                    </div>
                    {t.badge && (
                      <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">{t.badge}</Badge>
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
}
