import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { Rocket, Store, Users, FileText, DollarSign, Briefcase, Presentation, TrendingUp, Search, Target, LayoutDashboard } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, component: React.lazy(() => import('@/pages/EntrepreneurDashboardPage')) },
  { id: 'ventures', label: 'Ventures', icon: Rocket, component: React.lazy(() => import('@/pages/EntrepreneurVenturesPage')) },
  { id: 'marketplace', label: 'Marketplace', icon: Store, component: React.lazy(() => import('@/pages/MarketplacePage')) },
  { id: 'mentors', label: 'Mentors', icon: Users, component: React.lazy(() => import('@/pages/MentorDirectoryPage')) },
  { id: 'business-plan', label: 'Business Plan', icon: FileText, component: React.lazy(() => import('@/pages/EntrepreneurBusinessPlanPage')) },
  { id: 'pitch-deck', label: 'Pitch Deck', icon: Presentation, component: React.lazy(() => import('@/pages/EntrepreneurPitchDeckPage')) },
  { id: 'financials', label: 'Financials', icon: DollarSign, component: React.lazy(() => import('@/pages/EntrepreneurFinancialsPage')) },
  { id: 'milestones', label: 'Milestones', icon: Target, component: React.lazy(() => import('@/pages/EntrepreneurMilestonesPage')) },
  { id: 'funding', label: 'Funding', icon: Briefcase, component: React.lazy(() => import('@/pages/EntrepreneurFundingPage')) },
  { id: 'market-research', label: 'Research', icon: Search, component: React.lazy(() => import('@/pages/EntrepreneurMarketResearchPage')) },
  { id: 'paths', label: 'Skill Paths', icon: TrendingUp, component: React.lazy(() => import('@/pages/SkillsEntrepreneurshipPage')) },
];

const EntrepreneurHub = () => (
  <HubPageLayout
    title="Entrepreneur Hub"
    subtitle="Build, fund, and scale Zambian ventures end-to-end."
    icon={Rocket}
    tabs={tabs}
    defaultTab="overview"
  />
);

export default EntrepreneurHub;
