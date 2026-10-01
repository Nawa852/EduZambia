import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { BarChart3, Trophy, Award, FileText } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3, component: React.lazy(() => import('@/pages/LearningAnalytics')) },
  { id: 'achievements', label: 'Achievements', icon: Trophy, component: React.lazy(() => import('@/pages/Achievements')) },
  { id: 'certificates', label: 'Certificates', icon: FileText, component: React.lazy(() => import('@/pages/CertificatesPage')) },
];

const ProgressHub = () => (
  <HubPageLayout
    title="Progress & Achievements"
    subtitle="Track your learning journey, earn badges, and celebrate milestones."
    icon={Trophy}
    tabs={tabs}
    defaultTab="analytics"
  />
);

export default ProgressHub;
