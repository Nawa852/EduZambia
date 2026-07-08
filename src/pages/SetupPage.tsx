import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { LogoLoader } from '@/components/UI/LogoLoader';
import StudentOnboardingWizard from '@/components/Onboarding/StudentOnboardingWizard';
import TeacherOnboardingWizard from '@/components/Onboarding/TeacherOnboardingWizard';
import ParentOnboardingWizard from '@/components/Onboarding/ParentOnboardingWizard';
import DeveloperOnboardingWizard from '@/components/Onboarding/DeveloperOnboardingWizard';
import VocationalOnboardingWizard from '@/components/Onboarding/VocationalOnboardingWizard';
import EntrepreneurOnboardingWizard from '@/components/Onboarding/EntrepreneurOnboardingWizard';

const SetupPage = () => {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();

  const handleComplete = () => {
    const role = profile?.role || 'student';
    if (role === 'student' && !(profile as any)?.onboarding_extras_complete) {
      navigate('/setup-extras', { replace: true });
      return;
    }
    const roleHome: Record<string, string> = {
      teacher: '/teacher',
      guardian: '/family',
      institution: '/admin',
      ministry: '/ministry',
      doctor: '/medical',
      entrepreneur: '/entrepreneur',
      developer: '/developer',
      cybersecurity: '/cybersecurity',
      skills: '/dashboard',
      student: '/dashboard',
    };
    navigate(roleHome[role] || '/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LogoLoader size="lg" text="Loading your setup..." />
      </div>
    );
  }

  const role = profile?.role || 'student';

  const renderWizard = () => {
    switch (role) {
      case 'teacher':      return <TeacherOnboardingWizard onComplete={handleComplete} />;
      case 'guardian':     return <ParentOnboardingWizard onComplete={handleComplete} />;
      case 'developer':    return <DeveloperOnboardingWizard onComplete={handleComplete} />;
      case 'skills':       return <VocationalOnboardingWizard onComplete={handleComplete} />;
      case 'entrepreneur': return <EntrepreneurOnboardingWizard onComplete={handleComplete} />;
      default:             return <StudentOnboardingWizard onComplete={handleComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8 px-4">
      {renderWizard()}
    </div>
  );
};

export default SetupPage;
