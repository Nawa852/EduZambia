import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { isStudentNavVisible } from '@/config/studentFeatures';

/**
 * Paused features do not exist for students — no placeholder, no dead end.
 * Any deep link into one lands back on Home. Other roles pass straight through.
 */
const StudentFeatureGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useProfile();
  const { pathname, search } = useLocation();

  const isStudent = (profile?.role || 'student') === 'student';
  if (!isStudent || isStudentNavVisible(`${pathname}${search}`)) return <>{children}</>;

  return <Navigate to="/dashboard" replace />;
};

export default StudentFeatureGate;
