import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { Calendar, Timer, FileText, Target, BookOpen, Bookmark, Flame, Zap, Brain, CloudOff, Trophy } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'challenges', label: 'Daily Challenge', icon: Zap, component: React.lazy(() => import('@/pages/DailyChallengePage')), badge: 'NEW' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, component: React.lazy(() => import('@/pages/SocialLeaderboardPage')), badge: 'NEW' },
  { id: 'ai-planner', label: 'AI Planner', icon: Brain, component: React.lazy(() => import('@/pages/AIStudyPlannerPage')), badge: 'NEW' },
  { id: 'offline', label: 'Offline Mode', icon: CloudOff, component: React.lazy(() => import('@/pages/OfflineContentPage')), badge: 'NEW' },
  { id: 'planner', label: 'Study Planner', icon: Calendar, component: React.lazy(() => import('@/pages/StudyPlannerPage')) },
  { id: 'focus', label: 'Focus Mode', icon: Timer, component: React.lazy(() => import('@/pages/FocusModePage')) },
  { id: 'notes', label: 'My Notes', icon: FileText, component: React.lazy(() => import('@/pages/NotesWorkspacePage')) },
  { id: 'goals', label: 'Goals', icon: Target, component: React.lazy(() => import('@/pages/GoalsPage')) },
  { id: 'pomodoro', label: 'Pomodoro', icon: Flame, component: React.lazy(() => import('@/pages/PomodoroPage')) },
  { id: 'journal', label: 'Journal', icon: BookOpen, component: React.lazy(() => import('@/pages/JournalingPage')) },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, component: React.lazy(() => import('@/pages/BookmarksPage')) },
];

const PrepareHub = () => (
  <HubPageLayout
    title="Study Hub"
    subtitle="Daily challenges, focus tools, and study planning — all in one place."
    icon={Calendar}
    tabs={tabs}
    defaultTab="challenges"
    quickLinks={[
      { label: 'Daily Challenge', href: '/prepare?tab=challenges', icon: Zap },
      { label: 'Focus Mode', href: '/prepare?tab=focus', icon: Timer },
    ]}
  />
);

export default PrepareHub;
