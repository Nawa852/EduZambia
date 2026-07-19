import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { GraduationCap, BookOpen, Video, Tv, Sparkles, Library } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'study-room', label: 'Study Room', icon: Sparkles, component: React.lazy(() => import('@/pages/StudyRoomPage')), badge: 'AI' },
  { id: 'curriculum', label: 'Curriculum', icon: Library, component: React.lazy(() => import('@/pages/CurriculumPage')) },
  { id: 'my-courses', label: 'My Courses', icon: GraduationCap, component: React.lazy(() => import('@/pages/MyCoursesPage')) },
  { id: 'catalog', label: 'Browse', icon: BookOpen, component: React.lazy(() => import('@/pages/CourseCatalogPage')) },
  { id: 'lessons', label: 'Lessons', icon: BookOpen, component: React.lazy(() => import('@/pages/LessonsPage')) },
  { id: 'videos', label: 'Videos', icon: Video, component: React.lazy(() => import('@/pages/VideoLearningPage')) },
  { id: 'live', label: 'Live Classes', icon: Tv, component: React.lazy(() => import('@/pages/LiveLearningPage')), badge: 'LIVE' },
];

const LearnHub = () => (
  <HubPageLayout
    title="Learning Hub"
    subtitle="Curriculum, courses, lessons and live classes — all in one place."
    icon={GraduationCap}
    tabs={tabs}
    defaultTab="study-room"
    quickLinks={[
      { label: 'AI Tutor', href: '/ai?tab=tutor', icon: Sparkles },
      { label: 'ECZ Papers', href: '/ecz?tab=papers', icon: BookOpen },
    ]}
  />
);

export default LearnHub;
