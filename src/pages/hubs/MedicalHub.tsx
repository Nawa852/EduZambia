import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import {
  HeartPulse, Stethoscope, Microscope, Pill, FileText, ClipboardList,
  GraduationCap, Brain, Video, BookOpen, LayoutDashboard, Sparkles,
} from 'lucide-react';

type Tool = { title: string; desc: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: string };
type Group = { label: string; accent: string; tools: Tool[] };

const groups: Group[] = [
  {
    label: 'Clinical Practice',
    accent: 'from-rose-500/15 to-red-500/10',
    tools: [
      { title: 'Case Simulator', desc: 'Diagnose virtual patients', href: '/medical?tab=simulator', icon: Stethoscope, badge: 'SIM' },
      { title: 'Case Log', desc: 'Track patients seen', href: '/medical?tab=cases', icon: ClipboardList },
      { title: 'Clinical Notes', desc: 'SOAP templates', href: '/medical?tab=notes', icon: FileText },
      { title: 'Rotations', desc: 'Plan placements', href: '/medical?tab=rotations', icon: GraduationCap },
    ],
  },
  {
    label: 'Reference',
    accent: 'from-pink-500/15 to-fuchsia-500/10',
    tools: [
      { title: 'Drug Reference', desc: 'Zambian formulary', href: '/medical?tab=drugs', icon: Pill },
      { title: 'Anatomy & Pathology', desc: 'Study materials', href: '/learn?tab=catalog', icon: Microscope },
    ],
  },
  {
    label: 'Learn & Practice',
    accent: 'from-blue-500/15 to-cyan-500/10',
    tools: [
      { title: 'Free Healthcare Courses', desc: 'Harvard · Yale · WHO', href: '/free-courses?track=healthcare', icon: GraduationCap, badge: 'FREE' },
      { title: 'AI Clinical Tutor', desc: 'Ask any clinical question', href: '/ai?tab=tutor', icon: Brain, badge: 'AI' },
      { title: 'Video Lectures', desc: 'Curated medical videos', href: '/watch', icon: Video },
      { title: 'Reading List', desc: 'Saved papers & notes', href: '/prepare?tab=bookmarks', icon: BookOpen },
    ],
  },
];

const MedicalOverview: React.FC = () => (
  <div className="space-y-6">
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

const tabs: HubTab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, component: MedicalOverview },
  { id: 'ai-suite', label: 'AI Suite', icon: Sparkles, badge: 'AI', component: React.lazy(() => import('@/pages/AIMedicalSuitePage')) },
  { id: 'simulator', label: 'Case Simulator', icon: Stethoscope, badge: 'AI', component: React.lazy(() => import('@/pages/MedicalCaseSimulatorPage')) },
  { id: 'cases', label: 'Case Log', icon: ClipboardList, component: React.lazy(() => import('@/pages/MedicalCaseLogPage')) },
  { id: 'notes', label: 'Clinical Notes', icon: FileText, component: React.lazy(() => import('@/pages/MedicalClinicalNotesPage')) },
  { id: 'rotations', label: 'Rotations', icon: GraduationCap, component: React.lazy(() => import('@/pages/MedicalRotationsPage')) },
  { id: 'drugs', label: 'Drug Reference', icon: Pill, component: React.lazy(() => import('@/pages/MedicalDrugReferencePage')) },
];

const MedicalHub: React.FC = () => (
  <HubPageLayout
    title="Healthcare"
    subtitle="Clinical learning, case simulations and a Zambian drug reference for healthcare workers."
    icon={HeartPulse}
    tabs={tabs}
    defaultTab="overview"
    quickLinks={[
      { label: 'AI Tutor', href: '/ai?tab=tutor', icon: Brain },
      { label: 'Free Courses', href: '/free-courses?track=healthcare', icon: GraduationCap },
    ]}
  />
);

export default MedicalHub;
