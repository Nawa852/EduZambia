import React from 'react';
import { HubPageLayout, HubTab } from '@/components/Layout/HubPageLayout';
import { Sparkles, Camera, MessageSquare, Mic } from 'lucide-react';

/**
 * Synapse AI — the unified hub.
 * One input → key points, flashcards, quiz, visual lesson. Plus ask & snap.
 */
const tabs: HubTab[] = [
  { id: 'synapse-it', label: 'Synapse It', icon: Sparkles, component: React.lazy(() => import('@/pages/study/KnowYourStuffPage')) },
  { id: 'snap', label: 'Snap & Solve', icon: Camera, component: React.lazy(() => import('@/pages/SnapAndSolvePage')) },
  { id: 'ask', label: 'Ask', icon: MessageSquare, component: React.lazy(() => import('@/pages/AIChat')) },
  { id: 'voice', label: 'Voice', icon: Mic, component: React.lazy(() => import('@/pages/VoiceAITutorPage')) },
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
