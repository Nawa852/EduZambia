import { useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { installGlobalMonitoring } from '@/lib/monitoring';
import { useStarterSeed } from '@/hooks/useStarterSeed';

/**
 * Cross-cutting startup work: production monitoring and first-run data seeding.
 * Renders nothing.
 */
const AppBootstrap: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    installGlobalMonitoring();
  }, []);

  useStarterSeed(user?.id);

  return null;
};

export default AppBootstrap;
