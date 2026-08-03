import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { FileText, Play, Video, BookOpen, Target, Brain } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'papers', label: 'My Papers', icon: FileText, component: React.lazy(() => import('@/pages/ECZPastPapersPage')) },
  { id: 'simulator', label: 'Exam Simulator', icon: Play, component: React.lazy(() => import('@/pages/ECZExamSimulatorPage')), badge: 'NEW' },
  { id: 'quiz', label: 'Practice Quiz', icon: Target, component: React.lazy(() => import('@/pages/ECZPracticeQuizPage')) },
  { id: 'videos', label: 'Video Library', icon: Video, component: React.lazy(() => import('@/pages/ECZVideoLibraryPage')) },
  { id: 'resources', label: 'Resources', icon: BookOpen, component: React.lazy(() => import('@/pages/ECZResourcesExpandedPage')) },
];

const ECZHub = () => (
  <HubPageLayout
    title="ECZ Exam Hub"
    subtitle="Upload your own papers and notes — Synapse stores, organises and breaks them down for you."
    icon={FileText}
    tabs={tabs}
    defaultTab="papers"
    quickLinks={[
      { label: 'AI Exam Prep', href: '/ai?tab=quiz', icon: Brain },
      { label: 'Study Planner', href: '/prepare?tab=planner', icon: Target },
    ]}
  />
);

export default ECZHub;
