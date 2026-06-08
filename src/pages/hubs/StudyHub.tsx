import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import {
  BookOpen, Timer, FileText, Target, Bookmark, Calendar,
  Layers, ClipboardCheck, Brain, PenTool, Users, Map, FolderUp,
} from 'lucide-react';

type Tool = { title: string; desc: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: string };
type Group = { label: string; accent: string; tools: Tool[] };

const groups: Group[] = [
  {
    label: 'Focus & Planning',
    accent: 'from-emerald-500/15 to-teal-500/10',
    tools: [
      { title: 'Focus Mode', desc: 'Block distractions', href: '/prepare?tab=focus', icon: Timer },
      { title: 'Pomodoro', desc: '25 / 5 sprints', href: '/prepare?tab=pomodoro', icon: Timer },
      { title: 'Study Planner', desc: 'AI-built schedule', href: '/ai?tab=smart-planner', icon: Calendar, badge: 'AI' },
      { title: 'Goals', desc: 'Track milestones', href: '/prepare?tab=goals', icon: Target },
    ],
  },
  {
    label: 'Notes & Materials',
    accent: 'from-blue-500/15 to-cyan-500/10',
    tools: [
      { title: 'My Notes', desc: 'Offline notebook', href: '/prepare?tab=notes', icon: FileText },
      { title: 'Journal', desc: 'Daily reflection', href: '/prepare?tab=journal', icon: BookOpen },
      { title: 'Bookmarks', desc: 'Saved resources', href: '/prepare?tab=bookmarks', icon: Bookmark },
      { title: 'My Materials', desc: 'Upload PDFs for AI', href: '/my-materials', icon: FolderUp, badge: 'AI' },
      { title: 'Mind Maps', desc: 'Visualise concepts', href: '/ai?tab=mind-maps', icon: Map },
    ],
  },
  {
    label: 'Practice & Recall',
    accent: 'from-violet-500/15 to-fuchsia-500/10',
    tools: [
      { title: 'Flashcards', desc: 'Spaced repetition', href: '/ai?tab=flashcards', icon: Layers },
      { title: 'Quiz Generator', desc: 'Practice instantly', href: '/ai?tab=quiz', icon: Target },
      { title: 'Teach Back', desc: 'Explain to learn', href: '/ai?tab=teach-back', icon: PenTool },
      { title: 'Mock Exam', desc: 'Timed simulator', href: '/ecz?tab=simulator', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Study Together',
    accent: 'from-pink-500/15 to-rose-500/10',
    tools: [
      { title: 'Study Groups', desc: 'Group learning', href: '/connect?tab=groups', icon: Users },
      { title: 'AI Study Buddy', desc: 'Always-on partner', href: '/ai?tab=tutor', icon: Brain, badge: 'AI' },
    ],
  },
];

const StudyHub: React.FC = () => (
  <div className="space-y-6">
    <PageHeader
      icon={BookOpen}
      title="Study"
      subtitle="Focus, notes, flashcards and quizzes — everything to study smarter."
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

export default StudyHub;
