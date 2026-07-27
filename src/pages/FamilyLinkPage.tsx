import React from 'react';
import { GuardianLinkCard } from '@/components/Connect/GuardianLinkCard';

const FamilyLinkPage = () => (
  <div className="max-w-2xl mx-auto space-y-4">
    <GuardianLinkCard />
    <p className="text-xs text-muted-foreground px-1">
      Linked guardians can see attendance, grades and homework progress — never your private notes,
      chats or study material.
    </p>
  </div>
);

export default FamilyLinkPage;
