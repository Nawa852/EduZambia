import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { Users, BarChart3, Shield, ClipboardCheck, Gift, MessageSquare, FileText, Mail, Link2 } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'children', label: 'My Children', icon: Users, component: React.lazy(() => import('@/pages/ParentChildrenPage')) },
  { id: 'report', label: 'Weekly Report', icon: FileText, component: React.lazy(() => import('@/pages/GuardianWeeklyReportPage')) },
  { id: 'updates', label: 'Teacher Updates', icon: Mail, component: React.lazy(() => import('@/pages/ParentUpdatesPage')) },
  { id: 'grades', label: 'Grades & Progress', icon: BarChart3, component: React.lazy(() => import('@/pages/ParentGradesPage')) },
  { id: 'homework', label: 'Homework', icon: ClipboardCheck, component: React.lazy(() => import('@/pages/GuardianHomeworkTrackerPage')) },
  { id: 'rewards', label: 'Rewards', icon: Gift, component: React.lazy(() => import('@/pages/GuardianRewardSystemPage')) },
  { id: 'activity', label: 'Activity Feed', icon: MessageSquare, component: React.lazy(() => import('@/pages/GuardianActivityFeedPage')) },
  { id: 'controls', label: 'Parental Controls', icon: Shield, component: React.lazy(() => import('@/pages/ParentalControlsPage')) },
  { id: 'link', label: 'Link a Child', icon: Link2, component: React.lazy(() => import('@/pages/FamilyLinkPage')) },
];

const FamilyHub = () => (
  <HubPageLayout
    title="Family Dashboard"
    subtitle="See how your child is really doing — study time, quizzes, homework and teacher updates."
    icon={Users}
    tabs={tabs}
    defaultTab="children"
    quickLinks={[
      { label: 'Weekly report', href: '/family?tab=report', icon: FileText },
      { label: 'Link a child', href: '/family?tab=link', icon: Link2 },
    ]}
  />
);

export default FamilyHub;
