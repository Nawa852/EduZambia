import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { BookOpen, ClipboardCheck, FileText, BarChart3, Megaphone, Users, MessageSquare, Library, GraduationCap, FolderUp, Link as LinkIcon } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'courses', label: 'My Courses', icon: BookOpen, component: React.lazy(() => import('@/pages/Courses')) },
  { id: 'notes-repo', label: 'Notes Repo', icon: FileText, component: React.lazy(() => import('@/pages/TeacherNotesRepoPage')) },
  { id: 'specialization', label: 'Specialization', icon: GraduationCap, component: React.lazy(() => import('@/pages/TeacherSpecializationPage')) },
  { id: 'resource-library', label: 'External Library', icon: Library, component: React.lazy(() => import('@/pages/ResourceLibraryHubPage')) },
  { id: 'my-materials', label: 'My Materials', icon: FolderUp, component: React.lazy(() => import('@/pages/MyMaterialsPage')) },
  { id: 'gradebook', label: 'Gradebook', icon: ClipboardCheck, component: React.lazy(() => import('@/pages/TeacherGradebookPage')) },
  { id: 'lesson-plans', label: 'Lesson Plans', icon: FileText, component: React.lazy(() => import('@/pages/TeacherLessonPlanPage')) },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, component: React.lazy(() => import('@/pages/TeacherAnalyticsPage')) },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, component: React.lazy(() => import('@/pages/TeacherAnnouncementsPage')) },
  { id: 'attendance', label: 'Attendance', icon: Users, component: React.lazy(() => import('@/pages/TeacherAttendanceQRPage')) },
];

const TeachHub = () => (
  <HubPageLayout
    title="Teaching Hub"
    subtitle="Notes repository, specializations, lesson plans, gradebook, and attendance — all in one place."
    icon={ClipboardCheck}
    tabs={tabs}
    defaultTab="courses"
    quickLinks={[
      { label: 'External Library', href: '/resource-library', icon: LinkIcon },
      { label: 'Message Students', href: '/connect?tab=messenger', icon: MessageSquare },
    ]}
  />
);

export default TeachHub;
