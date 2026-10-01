import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import {
  Brain, LayoutGrid, MessageSquare, Mic, Calculator, Calendar, PenTool,
  Target, Layers, Upload, FileText, Zap, Swords, Lightbulb, Map, Sparkles, Camera, Boxes,
} from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'workplace',     label: 'BrightSphere',     icon: Sparkles,      component: React.lazy(() => import('@/pages/BrightSphereWorkplacePage')), badge: 'NEW' },
  { id: 'chat',          label: 'Chat',             icon: MessageSquare, component: React.lazy(() => import('@/pages/AIChat')), badge: 'NEW' },
  { id: 'artifacts',     label: 'Artifact Studio',  icon: Boxes,         component: React.lazy(() => import('@/pages/AIArtifactStudioPage')), badge: 'NEW' },
  { id: 'snap-solve',    label: 'Snap & Solve',     icon: Camera,        component: React.lazy(() => import('@/pages/SnapAndSolvePage')), badge: 'NEW' },
  { id: 'voice',         label: 'Voice',            icon: Mic,           component: React.lazy(() => import('@/pages/VoiceAITutorPage')), badge: 'NEW' },
  { id: 'homework',      label: 'Homework',         icon: Calculator,    component: React.lazy(() => import('@/pages/AIHomeworkSolverPage')) },
  { id: 'quiz',          label: 'Quiz',             icon: Target,        component: React.lazy(() => import('@/pages/AIQuizGeneratorPage')) },
  { id: 'flashcards',    label: 'Flashcards',       icon: Layers,        component: React.lazy(() => import('@/pages/AIFlashcardPage')) },
  { id: 'essay',         label: 'Essay',            icon: PenTool,       component: React.lazy(() => import('@/pages/EssayCoachPage')) },
  { id: 'mind-maps',     label: 'Mind Maps',        icon: Map,           component: React.lazy(() => import('@/pages/VisualMindMapPage')) },
  { id: 'doc-analyzer',  label: 'Documents',        icon: Upload,        component: React.lazy(() => import('@/pages/AIDocumentAnalyzerPage')) },
  { id: 'smart-planner', label: 'Planner',          icon: Calendar,      component: React.lazy(() => import('@/pages/AISmartStudyPlannerPage')) },
  { id: 'exam-gen',      label: 'Exam Gen',         icon: FileText,      component: React.lazy(() => import('@/pages/AIExamPaperGeneratorPage')) },
  { id: 'insights',      label: 'Insights',         icon: Lightbulb,     component: React.lazy(() => import('@/pages/LearningRecommendationsPage')) },
];

const AIHub = () => (
  <HubPageLayout
    title="AI Workspace"
    subtitle="BrightSphere AI — ask, solve, create and analyse for Zambian learners."
    icon={Brain}
    tabs={tabs}
    defaultTab="workplace"
  />
);

export default AIHub;
