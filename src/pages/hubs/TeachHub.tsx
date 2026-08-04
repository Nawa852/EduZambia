import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { BookOpen, ClipboardCheck, FileText, BarChart3, Megaphone, Users, MessageSquare, Library, GraduationCap, FolderUp, Link as LinkIcon, Wand2, Sparkles } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'courses', label: 'My Courses', icon: BookOpen, description: 'Your classes, enrolments and join codes', component: React.lazy(() => import('@/pages/Courses')) },
  { id: 'ai-suite', label: 'AI Suite', icon: Sparkles, badge: 'AI', description: 'Marking help, parent updates, activity ideas', component: React.lazy(() => import('@/pages/AITeacherSuitePage')) },
  { id: 'test-generator', label: 'Test Generator', icon: Wand2, badge: 'NEW', description: 'Full papers with charts and a marking scheme', component: React.lazy(() => import('@/pages/TeacherTestGeneratorPage')) },
  { id: 'lesson-plans', label: 'Lesson Plans', icon: FileText, description: 'ECZ-aligned plans you can print or export', component: React.lazy(() => import('@/pages/TeacherLessonPlanPage')) },
  { id: 'scheme-of-work', label: 'Scheme of Work', icon: FileText, description: 'Map the term week by week', component: React.lazy(() => import('@/pages/SchemeOfWorkPage')) },
  { id: 'gradebook', label: 'Gradebook', icon: ClipboardCheck, description: 'Mark submissions and release results', component: React.lazy(() => import('@/pages/TeacherGradebookPage')) },
  { id: 'attendance', label: 'Attendance', icon: Users, description: 'QR check-in and daily registers', component: React.lazy(() => import('@/pages/TeacherAttendanceQRPage')) },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Who is improving and who needs help', component: React.lazy(() => import('@/pages/TeacherAnalyticsPage')) },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, description: 'Message a whole class or their guardians', component: React.lazy(() => import('@/pages/TeacherAnnouncementsPage')) },
  { id: 'my-materials', label: 'My Materials', icon: FolderUp, description: 'Everything you have uploaded, organised', component: React.lazy(() => import('@/pages/MyMaterialsPage')) },
  { id: 'notes-repo', label: 'Notes Repo', icon: FileText, description: 'Shared notes contributed by teachers', component: React.lazy(() => import('@/pages/TeacherNotesRepoPage')) },
  { id: 'resource-library', label: 'Library', icon: Library, description: 'Open resources you can pull into a lesson', component: React.lazy(() => import('@/pages/ResourceLibraryHubPage')) },
  { id: 'specialization', label: 'Development', icon: GraduationCap, description: 'Track your CPD and specialisations', component: React.lazy(() => import('@/pages/TeacherSpecializationPage')) },
];

const TeachHub = () => (
  <HubPageLayout
    title="Teach"
    subtitle="Plan, deliver, mark and report — your whole teaching week in one place."
    icon={ClipboardCheck}
    tabs={tabs}
    defaultTab="courses"
    quickLinks={[
      { label: 'Generate a test', href: '/teach?tab=test-generator', icon: Wand2 },
      { label: 'Message students', href: '/connect?tab=messenger', icon: MessageSquare },
      { label: 'Open library', href: '/resource-library', icon: LinkIcon },
    ]}
  />
);

export default TeachHub;
