import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import {
  Wrench, Brain, MessageSquare, FileText, Upload, Calendar, Calculator,
  Zap, PenTool, Swords, Lightbulb, Layers, Target, Map, Sparkles, Mic,
  Timer, Bookmark, BookOpen, ClipboardCheck, Video, Users, Heart,
  Rocket, DollarSign, Briefcase, Code, Microscope, GraduationCap, Stethoscope,
} from 'lucide-react';

interface Tool {
  title: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface ToolGroup {
  label: string;
  accent: string;
  tools: Tool[];
}

const groups: ToolGroup[] = [
  {
    label: 'AI Study Tools',
    accent: 'from-blue-500/15 to-violet-500/10',
    tools: [
      { title: 'AI Chat', desc: 'Conversational tutor', href: '/ai?tab=chat', icon: MessageSquare },
      { title: 'AI Tutor', desc: 'Multi-model tutor', href: '/ai?tab=tutor', icon: Brain, badge: 'PRO' },
      { title: 'Voice Tutor', desc: 'Talk through topics', href: '/ai?tab=voice', icon: Mic },
      { title: 'Homework Solver', desc: 'Step-by-step help', href: '/ai?tab=homework', icon: Calculator },
      { title: 'Doc Analyzer', desc: 'Upload + summarise', href: '/ai?tab=doc-analyzer', icon: Upload },
      { title: 'Essay Coach', desc: 'Improve your writing', href: '/ai?tab=essay', icon: PenTool },
      { title: 'Debate Arena', desc: 'Argue with AI', href: '/ai?tab=debate', icon: Swords },
      { title: 'Flashcards', desc: 'Spaced repetition', href: '/ai?tab=flashcards', icon: Layers },
      { title: 'Quiz Generator', desc: 'Practice instantly', href: '/ai?tab=quiz', icon: Target },
      { title: 'Mind Maps', desc: 'Visualise concepts', href: '/ai?tab=mind-maps', icon: Map },
    ],
  },
  {
    label: 'Exam Prep',
    accent: 'from-emerald-500/15 to-teal-500/10',
    tools: [
      { title: 'Exam Generator', desc: 'AI-built exam papers', href: '/ai?tab=exam-gen', icon: FileText },
      { title: 'Exam Predictor', desc: 'Likely questions', href: '/ai?tab=exam-predict', icon: Zap },
      { title: 'Study Planner', desc: 'AI-built schedule', href: '/ai?tab=smart-planner', icon: Calendar },
      { title: 'ECZ Past Papers', desc: '2003 – 2024 archive', href: '/ecz?tab=papers', icon: FileText },
      { title: 'Exam Simulator', desc: 'Timed mock exam', href: '/ecz?tab=simulator', icon: ClipboardCheck },
      { title: 'Practice Quiz', desc: 'Topic drills', href: '/ecz?tab=quiz', icon: Target },
    ],
  },
  {
    label: 'Productivity',
    accent: 'from-orange-500/15 to-pink-500/10',
    tools: [
      { title: 'Focus Mode', desc: 'Block distractions', href: '/prepare?tab=focus', icon: Timer },
      { title: 'Pomodoro', desc: '25 / 5 sprints', href: '/prepare?tab=pomodoro', icon: Timer },
      { title: 'My Notes', desc: 'Offline notebook', href: '/prepare?tab=notes', icon: FileText },
      { title: 'Goals', desc: 'Track milestones', href: '/prepare?tab=goals', icon: Target },
      { title: 'Bookmarks', desc: 'Saved resources', href: '/prepare?tab=bookmarks', icon: Bookmark },
      { title: 'Journal', desc: 'Daily reflection', href: '/prepare?tab=journal', icon: BookOpen },
    ],
  },
  {
    label: 'Connect & Collaborate',
    accent: 'from-indigo-500/15 to-blue-500/10',
    tools: [
      { title: 'Messages', desc: '1:1 chat', href: '/connect?tab=messenger', icon: MessageSquare },
      { title: 'Study Groups', desc: 'Group learning', href: '/connect?tab=groups', icon: Users },
      { title: 'Video Rooms', desc: 'Live sessions', href: '/connect?tab=video', icon: Video },
      { title: 'Mentors', desc: 'Find a guide', href: '/connect?tab=mentorship', icon: Heart },
      { title: 'Peers', desc: 'Match by goals', href: '/connect?tab=peers', icon: Sparkles },
    ],
  },
  {
    label: 'Build & Earn',
    accent: 'from-rose-500/15 to-amber-500/10',
    tools: [
      { title: 'Entrepreneur Hub', desc: 'Launch a venture', href: '/entrepreneur', icon: Rocket },
      { title: 'Pitch Deck Gen', desc: 'AI pitch builder', href: '/entrepreneur?tab=pitch', icon: Sparkles, badge: 'AI' },
      { title: 'Marketplace', desc: 'Sell student services', href: '/entrepreneur?tab=marketplace', icon: Briefcase },
      { title: 'Mentors & Investors', desc: 'Funding directory', href: '/entrepreneur?tab=mentors', icon: DollarSign },
      { title: 'Cybersecurity Lab', desc: 'Hands-on tracks', href: '/cybersecurity', icon: Code },
      { title: 'Medical Sim', desc: 'Clinical cases', href: '/learn?tab=medical', icon: Microscope },
    ],
  },
];

const ToolsHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Tools & Resources"
        subtitle="Every tool in Synapse — AI, exam prep, productivity, collaboration — in one place."
      />

      {groups.map((g) => (
        <section key={g.label} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {g.label}
            </h2>
            <span className="text-[11px] text-muted-foreground">{g.tools.length} tools</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {g.tools.map((t) => (
              <Link key={t.href} to={t.href} className="group">
                <Card
                  className={`relative overflow-hidden p-4 h-full border-border/30 hover:border-primary/40 hover:shadow-card-hover transition-all bg-gradient-to-br ${g.accent}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center text-primary shadow-sm">
                      <t.icon className="w-4 h-4" />
                    </div>
                    {t.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    {t.desc}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ToolsHub;
