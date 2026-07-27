import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { useLoadingWatchdog } from '@/hooks/useLoadingWatchdog';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading, isDemo } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  const blocking = !isDemo && (authLoading || profileLoading);
  useLoadingWatchdog(blocking, 'Loading your experience');

  // Demo mode bypasses auth
  if (isDemo) return <>{children}</>;

  if (blocking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <LogoLoader size="lg" text="Loading your experience..." />
      </div>
    );
  }

  if (!user) {
    const publicPaths = ['/login', '/signup', '/welcome'];
    if (publicPaths.some(p => location.pathname.startsWith(p))) {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user && ['/login', '/signup', '/welcome'].includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }



  return <>{children}</>;
};

export default ProtectedRoute;
