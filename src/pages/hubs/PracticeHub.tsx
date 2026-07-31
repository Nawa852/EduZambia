import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { Target, FileText, Play, Calendar, Timer, FolderOpen } from 'lucide-react';

/**
 * Practice — the merged "Learn + Study + ECZ" tab.
 * Everything a student does between uploads: quizzes, papers, planning, focus.
 */
const tabs: HubTab[] = [
  { id: 'quiz', label: 'ECZ Quiz', icon: Target, component: React.lazy(() => import('@/pages/ECZPracticeQuizPage')) },
  { id: 'papers', label: 'Past Papers', icon: FileText, component: React.lazy(() => import('@/pages/ECZPastPapersPage')) },
  { id: 'simulator', label: 'Exam Simulator', icon: Play, component: React.lazy(() => import('@/pages/ECZExamSimulatorPage')) },
  { id: 'planner', label: 'Planner', icon: Calendar, component: React.lazy(() => import('@/pages/StudyPlannerPage')) },
  { id: 'focus', label: 'Focus', icon: Timer, component: React.lazy(() => import('@/pages/FocusModePage')) },
  { id: 'resources', label: 'Resources', icon: FolderOpen, component: React.lazy(() => import('@/pages/ECZResourcesExpandedPage')) },
];

const PracticeHub = () => (
  <HubPageLayout
    title="Practice"
    subtitle="ECZ quizzes, past papers, timed mocks and your revision plan — one place."
    icon={Target}
    tabs={tabs}
    defaultTab="quiz"
    quickLinks={[
      { label: 'Timed mock', href: '/practice?tab=simulator', icon: Play },
      { label: 'Focus timer', href: '/practice?tab=focus', icon: Timer },
    ]}
  />
);

export default PracticeHub;
