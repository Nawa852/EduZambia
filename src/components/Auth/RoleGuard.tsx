import React from 'react';
import { Navigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { AppRole } from '@/hooks/useRolePermission';

interface RoleGuardProps {
  allow: AppRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

const ROLE_ALIASES: Record<string, AppRole> = {
  parent: 'guardian',
  school_admin: 'institution',
  medical: 'doctor',
};

const RoleGuard: React.FC<RoleGuardProps> = ({ allow, children, redirectTo }) => {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center"><LogoLoader text="Checking access..." /></div>;
  }

  const raw = (profile?.role || 'student') as string;
  const role = (ROLE_ALIASES[raw] ?? raw) as AppRole;
  if (allow.includes(role)) return <>{children}</>;

  if (redirectTo) return <Navigate to={redirectTo} replace />;

  return (
    <div className="max-w-lg mx-auto py-12">
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-8 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Restricted area</h2>
          <p className="text-sm text-muted-foreground">
            This section is only available to {allow.join(', ')} accounts. You're signed in as <strong>{role}</strong>.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
            <Button onClick={() => navigate('/choose-role')}>Switch role</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleGuard;
