import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { LayoutDashboard, Users, BookOpen, Calendar, BarChart3, MessageSquare, ClipboardCheck, GraduationCap } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, component: React.lazy(() => import('@/pages/SchoolAdminDashboard')) },
  { id: 'teachers', label: 'Teachers', icon: GraduationCap, component: React.lazy(() => import('@/pages/SchoolAdminTeachersPage')) },
  { id: 'users', label: 'Users', icon: Users, component: React.lazy(() => import('@/pages/AdminUserManagementPage')) },
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen, component: React.lazy(() => import('@/pages/AdminCurriculumPage')) },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, component: React.lazy(() => import('@/pages/AdminAttendancePage')) },
  { id: 'scheduling', label: 'Scheduling', icon: Calendar, component: React.lazy(() => import('@/pages/AdminSchedulingPage')) },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, component: React.lazy(() => import('@/pages/AdminAnalyticsPage')) },
];

const AdminHub = () => (
  <HubPageLayout
    title="School Administration"
    subtitle="Manage users, curriculum, scheduling, and school-wide analytics."
    icon={LayoutDashboard}
    tabs={tabs}
    defaultTab="overview"
    quickLinks={[
      { label: 'Messages', href: '/connect?tab=messenger', icon: MessageSquare },
    ]}
  />
);

export default AdminHub;
