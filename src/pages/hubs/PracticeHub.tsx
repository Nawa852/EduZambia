import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { Target, FileText, Play, Calendar, Timer, FolderOpen, Sparkles, CircleDot } from 'lucide-react';

/**
 * Practice — the merged "Learn + Study + ECZ" tab.
 * The home tab is the learning circle; every other tile opens as an iOS-style tool sheet.
 */
const tabs: HubTab[] = [
  { id: 'circle', label: 'My Circle', icon: CircleDot, component: React.lazy(() => import('@/pages/study/LearningCirclePage')) },
  { id: 'quiz', label: 'ECZ Quiz', icon: Target, component: React.lazy(() => import('@/pages/ECZPracticeQuizPage')) },
  { id: 'know-your-stuff', label: 'Know Your Stuff', icon: Sparkles, component: React.lazy(() => import('@/pages/study/KnowYourStuffPage')) },
  { id: 'papers', label: 'Past Papers', icon: FileText, component: React.lazy(() => import('@/pages/ECZPastPapersPage')) },
  { id: 'simulator', label: 'Exam Simulator', icon: Play, component: React.lazy(() => import('@/pages/ECZExamSimulatorPage')) },
  { id: 'planner', label: 'Planner', icon: Calendar, component: React.lazy(() => import('@/pages/StudyPlannerPage')) },
  { id: 'focus', label: 'Focus Mode', icon: Timer, component: React.lazy(() => import('@/pages/FocusModePage')) },
  { id: 'resources', label: 'Resources', icon: FolderOpen, component: React.lazy(() => import('@/pages/ECZResourcesExpandedPage')) },
];

const PracticeHub = () => (
  <HubPageLayout
    title="Practice"
    subtitle="Capture, understand, practise, review, master — close the loop every week."
    icon={Target}
    tabs={tabs}
    defaultTab="circle"
    quickLinks={[
      { label: 'ECZ quiz', href: '/practice?tab=quiz', icon: Target },
      { label: 'Timed mock', href: '/practice?tab=simulator', icon: Play },
      { label: 'Focus timer', href: '/practice?tab=focus', icon: Timer },
    ]}
  />
);

export default PracticeHub;

