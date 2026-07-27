import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { User, Settings, Bell, Link2 } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'profile', label: 'Profile', icon: User, component: React.lazy(() => import('@/pages/ProfilePage')) },
  { id: 'family', label: 'Family link', icon: Link2, component: React.lazy(() => import('@/pages/FamilyLinkPage')) },
  { id: 'settings', label: 'Settings', icon: Settings, component: React.lazy(() => import('@/pages/SettingsPage')) },
  { id: 'notifications', label: 'Notifications', icon: Bell, component: React.lazy(() => import('@/pages/NotificationsPage')) },
];


const ProfileHub = () => (
  <HubPageLayout
    title="My Account"
    subtitle="Manage your profile, settings, and notification preferences."
    icon={User}
    tabs={tabs}
    defaultTab="profile"
  />
);

export default ProfileHub;
