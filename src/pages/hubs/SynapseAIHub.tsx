import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { Sparkles, Camera, MessageSquare, Mic } from 'lucide-react';

/**
 * Synapse AI — the unified hub.
 * One input → key points, flashcards, quiz, visual lesson. Plus ask & snap.
 */
const tabs: HubTab[] = [
  {
    id: 'synapse-it',
    label: 'Synapse It',
    icon: Sparkles,
    description: 'Turn notes, a past paper or a photo into a full study pack',
    component: React.lazy(() => import('@/pages/study/KnowYourStuffPage')),
  },
  {
    id: 'snap',
    label: 'Snap & Solve',
    icon: Camera,
    description: 'Photograph a question and get a worked, step-by-step answer',
    component: React.lazy(() => import('@/pages/SnapAndSolvePage')),
  },
  {
    id: 'ask',
    label: 'Ask',
    icon: MessageSquare,
    description: 'Chat with your tutor — markdown, maths and images supported',
    component: React.lazy(() => import('@/pages/AIChat')),
  },
  {
    id: 'voice',
    label: 'Voice',
    icon: Mic,
    description: 'Talk it through aloud and hear the explanation back',
    component: React.lazy(() => import('@/pages/VoiceAITutorPage')),
  },
];

const SynapseAIHub = () => (
  <HubPageLayout
    title="Synapse AI"
    subtitle="Drop your notes, a past paper or a photo of the board. Get everything back in seconds."
    icon={Sparkles}
    tabs={tabs}
    defaultTab="synapse-it"
    quickLinks={[
      { label: 'Snap the board', href: '/synapse?tab=snap', icon: Camera },
      { label: 'Ask a question', href: '/synapse?tab=ask', icon: MessageSquare },
    ]}
  />
);

export default SynapseAIHub;
