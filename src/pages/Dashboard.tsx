import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { StudentDashboardV2 } from '@/components/Dashboard/v2/StudentDashboardV2';
import { TeacherDashboardV2 } from '@/components/Dashboard/v2/TeacherDashboardV2';
import { EntrepreneurDashboardV2 } from '@/components/Dashboard/v2/EntrepreneurDashboardV2';
import { SchoolAdminDashboardV2 } from '@/components/Dashboard/v2/SchoolAdminDashboardV2';
import { GuardianDashboardView } from '@/components/Dashboard/GuardianDashboardView';
import { MedicalDashboardView } from '@/components/Dashboard/MedicalDashboardView';
import { DeveloperDashboardView } from '@/components/Dashboard/DeveloperDashboardView';
import SkillsDashboardView from '@/components/Dashboard/SkillsDashboardView';
import CybersecurityDashboardView from '@/components/Dashboard/CybersecurityDashboardView';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { OnboardingTour } from '@/components/Dashboard/OnboardingTour';

const Dashboard = () => {
  const { profile, loading } = useProfile();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      const shouldShow = localStorage.getItem('edu-zambia-show-tour') === 'true';
      const alreadyDone = localStorage.getItem('edu-zambia-tour-completed') === 'true';
      if (shouldShow && !alreadyDone) setShowTour(true);
    }
  }, [loading, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LogoLoader size="lg" text="Loading your workspace..." />
      </div>
    );
  }

  const userName = profile?.full_name || 'Learner';
  const userType = (profile?.role || 'student') as string;

  const renderDashboardView = () => {
    switch (userType) {
      case 'teacher': return <TeacherDashboardV2 userName={userName} />;
      case 'guardian': return <GuardianDashboardView userName={userName} />;
      case 'institution':
      case 'school_admin': return <SchoolAdminDashboardV2 userName={userName} />;
      case 'doctor': return <MedicalDashboardView userName={userName} />;
      case 'entrepreneur': return <EntrepreneurDashboardV2 userName={userName} />;
      case 'developer': return <DeveloperDashboardView userName={userName} />;
      case 'skills': return <SkillsDashboardView />;
      case 'cybersecurity': return <CybersecurityDashboardView />;
      default: return <StudentDashboardV2 userName={userName} />;
    }
  };

  return (
    <div>
      {showTour && <OnboardingTour role={userType} onComplete={() => setShowTour(false)} />}
      {renderDashboardView()}
    </div>
  );
};

export default Dashboard;
