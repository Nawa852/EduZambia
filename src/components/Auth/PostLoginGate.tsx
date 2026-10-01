import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useScheduleReminders } from '@/hooks/useScheduleReminders';

import { LogoLoader } from '@/components/UI/LogoLoader';

interface PostLoginGateProps {
  children: React.ReactNode;
}

const PostLoginGate: React.FC<PostLoginGateProps> = ({ children }) => {
  const { user, isDemo } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  // Mount global study-schedule reminders for authenticated users
  useScheduleReminders();

  // Demo mode skips all gates
  if (isDemo) return <>{children}</>;

  // Don't gate these paths
  const exemptPaths = ['/setup', '/login', '/signup', '/auth', '/password-reset', '/settings', '/profile'];
  if (exemptPaths.some(p => location.pathname.startsWith(p))) {
    return <>{children}</>;
  }

  if (!user || profileLoading) {
    return <>{children}</>;
  }

  // Check completeness conditions
  const profileComplete = !!(profile?.full_name?.trim());
  const setupDone = !!(profile as any)?.device_setup_complete;
  const role = profile?.role || 'student';

  // Roles that should be routed through their tailored onboarding wizard
  const onboardableRoles = ['student','teacher','guardian'];
  const needsSetup = onboardableRoles.includes(role);

  if (needsSetup && (!profileComplete || !setupDone)) {
    return <Navigate to="/setup" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default PostLoginGate;
