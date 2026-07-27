import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft } from 'lucide-react';

/**
 * Routes that belong to the non-school stakeholder verticals.
 * During the school pilot these render blurred behind a "Coming soon" panel.
 */
const LOCKED_PREFIXES = [
  '/medical',
  '/ngo',
  '/donor',
  '/entrepreneur',
  '/developer',
  '/skills-',
  '/skill-passport',
  '/skills-lab',
  '/cyber',
  '/marketplace',
  '/ai-medical-suite',
  '/ai-developer-suite',
  '/ai-ngo-suite',
  '/ai-skills-suite',
  '/ai-business-suite',
];

export function isLockedPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return LOCKED_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix));
}

export const ComingSoonGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  if (!isLockedPath(location.pathname)) return <>{children}</>;

  return (
    <div className="relative min-h-[70vh]">
      <div aria-hidden className="pointer-events-none select-none blur-[6px] opacity-40 saturate-50">
        {children}
      </div>

      <div className="absolute inset-0 flex items-start justify-center pt-24 px-4">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-background/80 backdrop-blur-xl shadow-2xl p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Coming soon</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We&apos;re focused on the school experience first — students, parents, teachers and
            school admins. This workspace unlocks in a later release.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Go back
            </Button>
            <Button onClick={() => navigate('/dashboard')}>Open my dashboard</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonGate;
