import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { MessageSquare, Users, Globe, Heart, Sparkles, CalendarDays, Video } from 'lucide-react';

const tabs: HubTab[] = [
  { id: 'feed', label: 'Feed', icon: Globe, component: React.lazy(() => import('@/pages/SocialFeedPageV2')) },
  { id: 'messenger', label: 'Messages', icon: MessageSquare, component: React.lazy(() => import('@/pages/DirectMessagesPage')) },
  { id: 'groups', label: 'Groups', icon: Users, component: React.lazy(() => import('@/pages/StudyGroupsHubPage')) },
  { id: 'video', label: 'Video Rooms', icon: Video, component: React.lazy(() => import('@/pages/VideoRoomsPage')) },
  { id: 'peers', label: 'Peers', icon: Sparkles, component: React.lazy(() => import('@/pages/PeerMatchingPage')) },
  { id: 'mentorship', label: 'Mentors', icon: Heart, component: React.lazy(() => import('@/pages/MentorConnectPage')) },
  { id: 'events', label: 'Events', icon: CalendarDays, component: React.lazy(() => import('@/pages/CommunityEventsPage')) },
];

const ConnectHub = () => (
  <HubPageLayout
    title="Connect"
    subtitle="Chat, collaborate, and learn with teachers, peers, and mentors."
    icon={Users}
    tabs={tabs}
    defaultTab="feed"
    quickLinks={[
      { label: 'Find Peers', href: '/connect?tab=peers', icon: Sparkles },
      { label: 'Events', href: '/connect?tab=events', icon: CalendarDays },
      { label: 'Mentors', href: '/connect?tab=mentorship', icon: Heart },
    ]}
  />
);

export default ConnectHub;
