import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { Heart, Target, DollarSign, School, Activity, Sparkles } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'impact', label: 'Impact', icon: Activity, component: React.lazy(() => import('@/pages/NGOImpactPage')) },
  { id: 'ai-suite', label: 'AI Suite', icon: Sparkles, badge: 'AI', component: React.lazy(() => import('@/pages/AINGOSuitePage')) },
  { id: 'programs', label: 'Programs', icon: Target, component: React.lazy(() => import('@/pages/NGOProgramsPage')) },
  { id: 'grants', label: 'Grants', icon: DollarSign, component: React.lazy(() => import('@/pages/NGOGrantsPage')) },
  { id: 'schools', label: 'Schools', icon: School, component: React.lazy(() => import('@/pages/NGOSchoolsPage')) },
];

const NGOHub = () => (
  <HubPageLayout
    title="NGO Workspace"
    subtitle="Manage education programs, donors, partner schools, and field impact."
    icon={Heart}
    tabs={tabs}
    defaultTab="impact"
  />
);

export default NGOHub;
