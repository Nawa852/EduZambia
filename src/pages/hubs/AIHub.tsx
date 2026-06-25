import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { Brain, LayoutGrid, MessageSquare, Mic, Calculator, Calendar, PenTool, Target, Layers, Upload } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'overview',     label: 'Overview',       icon: LayoutGrid,    component: React.lazy(() => import('@/pages/AIWorkspaceLanding')) },
  { id: 'chat',         label: 'Chat',           icon: MessageSquare, component: React.lazy(() => import('@/pages/AIChat')) },
  { id: 'tutor',        label: 'Tutor',          icon: Brain,         component: React.lazy(() => import('@/pages/MultiAITutorPage')), badge: 'PRO' },
  { id: 'voice',        label: 'Voice',          icon: Mic,           component: React.lazy(() => import('@/pages/VoiceAITutorPage')), badge: 'NEW' },
  { id: 'homework',     label: 'Homework',       icon: Calculator,    component: React.lazy(() => import('@/pages/AIHomeworkSolverPage')) },
  { id: 'quiz',         label: 'Quiz',           icon: Target,        component: React.lazy(() => import('@/pages/AIQuizGeneratorPage')) },
  { id: 'flashcards',   label: 'Flashcards',     icon: Layers,        component: React.lazy(() => import('@/pages/AIFlashcardPage')) },
  { id: 'essay',        label: 'Essay',          icon: PenTool,       component: React.lazy(() => import('@/pages/EssayCoachPage')) },
  { id: 'doc-analyzer', label: 'Documents',      icon: Upload,        component: React.lazy(() => import('@/pages/AIDocumentAnalyzerPage')) },
  { id: 'smart-planner',label: 'Planner',        icon: Calendar,      component: React.lazy(() => import('@/pages/AISmartStudyPlannerPage')) },
];

const AIHub = () => (
  <HubPageLayout
    title="AI Workspace"
    subtitle="BrightSphere AI — ask, solve, create and analyse for Zambian learners."
    icon={Brain}
    tabs={tabs}
    defaultTab="overview"
  />
);

export default AIHub;
