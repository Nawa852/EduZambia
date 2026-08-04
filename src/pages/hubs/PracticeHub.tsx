import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { Target, FileText, Play, Calendar, Timer, FolderOpen, Sparkles, CircleDot } from 'lucide-react';

/**
 * Practice — the merged "Learn + Study + ECZ" tab.
 * The home tab is the learning circle; every other tile opens as an iOS-style tool sheet.
 */
const tabs: HubTab[] = [
  {
    id: 'circle',
    label: 'My Circle',
    icon: CircleDot,
    description: 'Your five-step weekly loop and what to do next',
    component: React.lazy(() => import('@/pages/study/LearningCirclePage')),
  },
  {
    id: 'quiz',
    label: 'ECZ Quiz',
    icon: Target,
    description: 'Practise questions with instant marking and explanations',
    component: React.lazy(() => import('@/pages/ECZPracticeQuizPage')),
  },
  {
    id: 'know-your-stuff',
    label: 'Break it down',
    icon: Sparkles,
    description: 'Summary, key points, flashcards and a quiz from your material',
    component: React.lazy(() => import('@/pages/study/KnowYourStuffPage')),
  },
  {
    id: 'papers',
    label: 'My Papers',
    icon: FileText,
    description: 'Past papers and materials you have uploaded',
    component: React.lazy(() => import('@/pages/ECZPastPapersPage')),
  },
  {
    id: 'simulator',
    label: 'Exam Simulator',
    icon: Play,
    description: 'Timed mock exam under real conditions',
    component: React.lazy(() => import('@/pages/ECZExamSimulatorPage')),
  },
  {
    id: 'planner',
    label: 'Planner',
    icon: Calendar,
    description: 'Pace the weeks before your exam with daily goals',
    component: React.lazy(() => import('@/pages/StudyPlannerPage')),
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    icon: Timer,
    description: 'Pomodoro timer that keeps running in the background',
    component: React.lazy(() => import('@/pages/FocusModePage')),
  },
  {
    id: 'resources',
    label: 'Library',
    icon: FolderOpen,
    description: 'Every file you have uploaded, organised by subject',
    component: React.lazy(() => import('@/pages/ECZResourcesExpandedPage')),
  },
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
