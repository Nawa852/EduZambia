import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { LogoLoader } from '@/components/UI/LogoLoader';
import StudentOnboardingWizard from '@/components/Onboarding/StudentOnboardingWizard';
import TeacherOnboardingWizard from '@/components/Onboarding/TeacherOnboardingWizard';
import ParentOnboardingWizard from '@/components/Onboarding/ParentOnboardingWizard';

const SetupPage = () => {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();

  const handleComplete = () => {
    // After the role-specific wizard, send students through the extras wizard
    // (materials uploads, YouTube sync, timetable, guardian, app-block consent)
    const role = profile?.role || 'student';
    if (role === 'student' && !(profile as any)?.onboarding_extras_complete) {
      navigate('/setup-extras', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LogoLoader size="lg" text="Loading your setup..." />
      </div>
    );
  }

  const role = profile?.role || 'student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8 px-4">
      {role === 'teacher' ? (
        <TeacherOnboardingWizard onComplete={handleComplete} />
      ) : role === 'guardian' ? (
        <ParentOnboardingWizard onComplete={handleComplete} />
      ) : (
        <StudentOnboardingWizard onComplete={handleComplete} />
      )}
    </div>
  );
};

export default SetupPage;
