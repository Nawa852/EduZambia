import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import {
  HeartPulse, Stethoscope, Microscope, Pill, FileText, ClipboardList,
  GraduationCap, Brain, Video, BookOpen,
} from 'lucide-react';

type Tool = { title: string; desc: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: string };
type Group = { label: string; accent: string; tools: Tool[] };

const groups: Group[] = [
  {
    label: 'Clinical Practice',
    accent: 'from-rose-500/15 to-red-500/10',
    tools: [
      { title: 'Case Simulator', desc: 'Diagnose virtual patients', href: '/medical-case-simulator', icon: Stethoscope, badge: 'SIM' },
      { title: 'Case Log', desc: 'Track patients seen', href: '/medical-case-log', icon: ClipboardList },
      { title: 'Clinical Notes', desc: 'SOAP templates', href: '/medical-clinical-notes', icon: FileText },
      { title: 'Rotations', desc: 'Plan placements', href: '/medical-rotations', icon: GraduationCap },
    ],
  },
  {
    label: 'Reference',
    accent: 'from-pink-500/15 to-fuchsia-500/10',
    tools: [
      { title: 'Drug Reference', desc: 'Zambian formulary', href: '/medical-drug-reference', icon: Pill },
      { title: 'Anatomy & Pathology', desc: 'Study materials', href: '/learn?tab=catalog', icon: Microscope },
    ],
  },
  {
    label: 'Learn & Practice',
    accent: 'from-blue-500/15 to-cyan-500/10',
    tools: [
      { title: 'Free Healthcare Courses', desc: 'Harvard · Yale · WHO', href: '/free-courses?track=healthcare', icon: GraduationCap, badge: 'FREE' },
      { title: 'AI Tutor', desc: 'Ask any clinical question', href: '/ai?tab=tutor', icon: Brain, badge: 'AI' },
      { title: 'Video Lectures', desc: 'Curated medical videos', href: '/watch', icon: Video },
      { title: 'Reading List', desc: 'Saved papers & notes', href: '/prepare?tab=bookmarks', icon: BookOpen },
    ],
  },
];

const MedicalHub: React.FC = () => (
  <div className="space-y-6">
    <PageHeader
      icon={HeartPulse}
      title="Healthcare"
      subtitle="Clinical learning, case simulations and a Zambian drug reference for healthcare workers."
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

export default MedicalHub;
